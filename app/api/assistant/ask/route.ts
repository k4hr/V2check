/* path: app/api/assistant/ask/route.ts */
import { NextResponse, NextRequest } from 'next/server';
import { askAI, type ChatMessage } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import cleanAssistantText from '@/lib/cleanText';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Дневные лимиты */
const FREE_QA_PER_DAY     = Number(process.env.FREE_QA_PER_DAY     ?? 2);
const PRO_QA_PER_DAY      = Number(process.env.PRO_QA_PER_DAY      ?? 100);
const PROPLUS_QA_PER_DAY  = Number(process.env.PROPLUS_QA_PER_DAY  ?? 200);

/** Модели (как было, с фолбэками) */
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
  MODEL_PRO;

function pickModelByMode(mode?: string): string {
  if (!mode) return MODEL_DEFAULT;
  if (mode.startsWith('proplus-')) return MODEL_PRO_PLUS; // Бизнес/усиленные режимы для Pro+
  if (mode.startsWith('legal-'))   return MODEL_PRO;      // Юр-режимы для Pro
  return MODEL_DEFAULT;
}

function todayStr() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** ===== Helpers для учёта дневных лимитов (Pro/Pro+) ===== */
async function getUsedToday(userId: string, date: string) {
  const row = await prisma.usageDaily.findUnique({
    where: { userId_date: { userId, date } },
    select: { used: true },
  });
  return row?.used ?? 0;
}

async function incUsedToday(userId: string, date: string) {
  await prisma.usageDaily.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, used: 1 },
    update: { used: { increment: 1 } },
  });
}

/** Определение уровня подписки */
type TierLevel = 'FREE'|'PRO'|'PROPLUS';
async function resolveTierByTgId(tgId?: string|null): Promise<{ tier: TierLevel; userId?: string }> {
  if (!tgId) return { tier: 'FREE' };
  const user = await prisma.user.findFirst({
    where: { telegramId: String(tgId) },
    select: { id: true, plan: true, subscriptionUntil: true },
  });
  const active = !!user?.subscriptionUntil && user.subscriptionUntil > new Date();
  if (!active || !user?.id) return { tier: 'FREE' };

  const plan = String(user.plan || '').toUpperCase();
  if (plan === 'PROPLUS') return { tier: 'PROPLUS', userId: user.id };
  if (plan === 'PRO')     return { tier: 'PRO',     userId: user.id };
  // на всякий случай — неизвестный план считаем как PRO
  return { tier: 'PRO', userId: user.id };
}

/** Основной хэндлер */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt  = String(body?.prompt || '').trim();
    const history = (body?.history || []) as ChatMessage[];
    const mode    = String(body?.mode || '');
    const model   = pickModelByMode(mode);

    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'EMPTY_PROMPT' }, { status: 400 });
    }

    // Telegram ID берём из query (?id=...) — как у тебя уже сделано в фронте
    const { searchParams } = new URL(req.url);
    const tgId = searchParams.get('id');

    const { tier, userId } = await resolveTierByTgId(tgId);
    const today = todayStr();

    // ===== FREE: считаем лимит куками (как раньше) =====
    if (tier === 'FREE') {
      const usedStr = req.cookies.get('ai_free_used')?.value || '0';
      const dateStr = req.cookies.get('ai_free_date')?.value || '';
      let used = Number(usedStr) || 0;
      if (dateStr !== today) used = 0;

      if (used >= FREE_QA_PER_DAY) {
        return NextResponse.json(
          { ok: false, error: 'DAILY_LIMIT_REACHED', level: 'FREE', limit: FREE_QA_PER_DAY, used, remaining: 0 },
          { status: 429 },
        );
      }

      const raw = await askAI(
        [
          { role: 'system', content: 'Ты ассистент. Пиши кратко, без Markdown.' },
          ...history,
          { role: 'user', content: prompt },
        ],
        { model }
      );

      const answer = cleanAssistantText(raw);

      const resp = NextResponse.json({
        ok: true,
        answer,
        model,
        level: 'FREE',
        limit: FREE_QA_PER_DAY,
        used: used + 1,
        remaining: Math.max(FREE_QA_PER_DAY - (used + 1), 0),
      });

      const expires = new Date(); expires.setUTCHours(23, 59, 59, 999);
      resp.cookies.set('ai_free_used', String(used + 1), { path: '/', expires });
      resp.cookies.set('ai_free_date', today, { path: '/', expires });
      return resp;
    }

    // ===== PRO / PROPLUS: считаем в БД =====
    const limit = tier === 'PROPLUS' ? PROPLUS_QA_PER_DAY : PRO_QA_PER_DAY;
    const used = await getUsedToday(userId!, today); // userId гарантирован для Pro/Pro+

    if (used >= limit) {
      return NextResponse.json(
        { ok: false, error: 'DAILY_LIMIT_REACHED', level: tier, limit, used, remaining: 0 },
        { status: 429 },
      );
    }

    const raw = await askAI(
      [
        { role: 'system', content: 'Ты ассистент. Пиши развернуто, но без Markdown.' },
        ...history,
        { role: 'user', content: prompt },
      ],
      { model }
    );

    const answer = cleanAssistantText(raw);

    // инкремент только после успешного ответа от модели
    await incUsedToday(userId!, today);

    const usedNew = used + 1;

    return NextResponse.json({
      ok: true,
      answer,
      model,
      level: tier,
      limit,
      used: usedNew,
      remaining: Math.max(limit - usedNew, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
} catch (e: any) {
  const msg = String(e?.message || 'SERVER_ERROR');

  // Пробуем распарсить наши ошибки из lib/ai.ts вида: "AI_HTTP_429: ...".
  const m = /^AI_HTTP_(\d+):\s*(.*)$/.exec(msg);
  if (m) {
    const status = Number(m[1]);
    return NextResponse.json(
      { ok: false, error: 'AI_ERROR', status, detail: m[2] },
      { status }
    );
  }

  if (msg === 'AI_API_KEY_MISSING') {
    return NextResponse.json(
      { ok: false, error: 'AI_API_KEY_MISSING', detail: 'Set AI_API_KEY (or OPENAI_API_KEY) on the server' },
      { status: 500 }
    );
  }

  if (/aborted|timeout/i.test(msg)) {
    return NextResponse.json(
      { ok: false, error: 'AI_TIMEOUT', detail: msg },
      { status: 504 }
    );
  }

  return NextResponse.json(
    { ok: false, error: 'SERVER_ERROR', detail: msg },
    { status: 500 }
  );
}
