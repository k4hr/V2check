// app/api/assistant/ask/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { askAI, type ChatMessage } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import {
  checkAndCountDailyUsage,
  enforceByTier,
  getDailyLimitByTier,
  getUserTier,
  todayUTC,
  type Tier
} from '@/lib/limits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- МОДЕЛИ: AI_* (канон), с фолбэком на OPENAI_* ---
const MODEL_DEFAULT =
  process.env.AI_MODEL ||
  process.env.OPENAI_MODEL ||
  process.env.OPENAI_MODEL_DEFAULT ||
  'gpt-4o-mini';

const MODEL_PRO =
  process.env.AI_MODEL_PRO ||
  process.env.OPENAI_MODEL_PRO ||
  MODEL_DEFAULT;

const MODEL_PRO_PLUS =
  process.env.AI_MODEL_PRO_PLUS ||
  process.env.OPENAI_MODEL_PRO_PLUS ||
  'gpt-4o';

type Mode = '' | 'pro' | 'proplus';

function normalizeMode(raw?: string): Mode {
  const s = String(raw || '').toLowerCase();
  if (s.startsWith('proplus') || s === 'proplus' || s === 'plus' || s === 'max') return 'proplus';
  if (s.startsWith('pro') || s === 'pro') return 'pro';
  return '';
}

function detectModeFromReq(req: NextRequest, bodyMode?: string): Mode {
  const byBody = normalizeMode(bodyMode);
  if (byBody) return byBody;

  const ref = (req.headers.get('referer') || '').toLowerCase();
  if (ref.includes('/home/pro-plus')) return 'proplus';
  if (ref.includes('/home/pro/')) return 'pro';
  return '';
}

function pickModelByMode(mode: Mode): string {
  if (mode === 'proplus') return MODEL_PRO_PLUS;
  if (mode === 'pro') return MODEL_PRO;
  return MODEL_DEFAULT;
}

function defaultSystemByMode(mode: Mode): string {
  if (mode === 'proplus') return 'Ты ассистент. Расписывай все подробно, без Markdown.';
  if (mode === 'pro') return 'Ты ассистент. Пиши кратко, без Markdown.';
  return process.env.SYSTEM_PROMPT_DEFAULT || 'Ты ассистент. Пиши кратко, без Markdown.';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    const history = (Array.isArray(body?.history) ? body.history : []) as ChatMessage[];
    const mode = detectModeFromReq(req, String(body?.mode || ''));
    const model = pickModelByMode(mode);

    // system можно прокинуть с фронта (локальный prompt рядом со страницей)
    const incomingSystem = typeof body?.system === 'string' ? String(body.system).trim() : '';
    const system = incomingSystem || defaultSystemByMode(mode);

    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'EMPTY_PROMPT' }, { status: 400 });
    }

    // Определяем user по telegramId (?id=...), создаём при первом заходе.
    const { searchParams } = new URL(req.url);
    const tgId = searchParams.get('id');
    let userId: string | null = null;
    let tier: Tier = 'FREE';

    if (tgId) {
      const user = await prisma.user.upsert({
        where: { telegramId: String(tgId) },
        create: { telegramId: String(tgId), lastSeenAt: new Date() },
        update: { lastSeenAt: new Date() },
        select: { id: true, plan: true, subscriptionUntil: true },
      });
      userId = user.id;
      tier = getUserTier(user);
    } else {
      // fallback без id — считаем анонимом (FREE) и ниже применим cookie-лимит
      tier = 'FREE';
    }

    // ---- ЛИМИТЫ ----
    const limit = getDailyLimitByTier(tier);
    const enforce = enforceByTier(tier);
    let used = 0;

    if (userId) {
      const res = await checkAndCountDailyUsage(prisma, userId, limit, enforce);
      used = res.used;
      if (!res.ok && res.reached) {
        return NextResponse.json(
          { ok: false, error: 'LIMIT_REACHED', tier, limit, used, date: todayUTC() },
          { status: 429 }
        );
      }
    } else {
      // fallback для анонимов: простые cookie-лимиты
      const cookies = req.cookies;
      const usedStr = cookies.get('ai_free_used')?.value || '0';
      const dateStr = cookies.get('ai_free_date')?.value || '';
      const today = todayUTC();
      let u = Number(usedStr) || 0;
      if (dateStr !== today) u = 0;
      if (enforce && limit > 0 && u >= limit) {
        return NextResponse.json(
          { ok: false, error: 'LIMIT_REACHED', tier, limit, used: u, date: today },
          { status: 429 }
        );
      }
      u += 1;
      used = u;
    }

    // ---- СБОРКА СООБЩЕНИЙ ----
    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      ...history.filter(m => m && (m.role === 'user' || m.role === 'assistant')),
      { role: 'user', content: prompt },
    ];

    const answer = await askAI(messages, { model });

    const resp = NextResponse.json({
      ok: true,
      answer,
      model,
      mode,
      tier,
      limit,
      used,
    });

    // если работали по кукам (аноним) — проставим их тут
    if (!userId) {
      const today = todayUTC();
      const expires = new Date();
      expires.setUTCHours(23, 59, 59, 999);
      resp.cookies.set('ai_free_used', String(used), { path: '/', expires });
      resp.cookies.set('ai_free_date', today, { path: '/', expires });
    }

    return resp;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
