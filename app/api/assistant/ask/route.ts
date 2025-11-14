/* path: app/api/assistant/ask/route.ts */
import { NextResponse, NextRequest } from 'next/server';
import { askAI, type ChatMessage } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import cleanAssistantText from '@/lib/cleanText';
import { verifyInitData, getTelegramId, getInitDataFrom } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Дневные лимиты */
const FREE_QA_PER_DAY     = Number(process.env.FREE_QA_PER_DAY     ?? 2);
const PRO_QA_PER_DAY      = Number(process.env.PRO_QA_PER_DAY      ?? 100);
const PROPLUS_QA_PER_DAY  = Number(process.env.PROPLUS_QA_PER_DAY  ?? 200);

/** Модели (из .env с безопасными фолбэками) */
const MODEL_FREE =
  process.env.AI_MODEL_FREE ||
  process.env.OPENAI_MODEL_FREE ||
  'gpt-4o-mini'; // Бесплатная — GPT-4 mini

const MODEL_PRO =
  process.env.AI_MODEL_PRO ||
  process.env.OPENAI_MODEL_PRO ||
  MODEL_FREE;

const MODEL_PRO_PLUS =
  process.env.AI_MODEL_PRO_PLUS ||
  process.env.OPENAI_MODEL_PRO_PLUS ||
  MODEL_PRO;

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

type TierLevel = 'FREE'|'PRO'|'PROPLUS';

/** Telegram ID из заголовков/cookies/qs */
function resolveTelegramId(req: NextRequest): string | null {
  const initData =
    req.headers.get('x-init-data') ||
    req.headers.get('x-tg-init-data') ||
    getInitDataFrom(req as any) ||
    '';
  if (initData && BOT_TOKEN && verifyInitData(initData, BOT_TOKEN)) {
    const id = getTelegramId(initData);
    if (id) return String(id);
  }
  const { searchParams } = new URL(req.url);
  const qsId = searchParams.get('id');
  if (qsId && /^\d{3,15}$/.test(qsId)) return qsId;
  return null;
}

/** План по Telegram ID */
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
  return { tier: 'PRO', userId: user.id };
}

/** Утилиты */
function todayStr() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Vision helpers */
function isSupportedImageUrl(u?: string): boolean {
  if (!u) return false;
  if (u.startsWith('data:image/')) return true;
  try { const url = new URL(u); return url.protocol === 'https:' && !!url.hostname; } catch { return false; }
}

/** Сборка контента user-сообщения.
 * ВАЖНО: используем input_image — это нативный формат для /v1/responses.
 * В lib/ai.ts есть конвертация под Chat Completions.
 */
function buildUserContent(prompt: string, images?: string[]) {
  const content: any[] = [];
  const text = (prompt || '').trim();
  if (text) content.push({ type: 'text', text });

  const arr = Array.isArray(images) ? images.filter(isSupportedImageUrl) : [];
  for (const url of arr) {
    content.push({ type: 'input_image', image_url: { url } });
  }
  return content.length ? content : [{ type: 'text', text: '' }];
}

function toMultimodalHistory(history: ChatMessage[]): ChatMessage[] {
  return (history || []).map((m) => {
    const txt = typeof (m as any).content === 'string' ? (m as any).content : '';
    return { role: m.role, content: [{ type: 'text', text: txt }] } as ChatMessage;
  });
}

/** Выбор модели по подписке */
function pickModelByTier(tier: TierLevel): string {
  if (tier === 'PROPLUS') return MODEL_PRO_PLUS; // напр. gpt-5 / gpt-5.1
  if (tier === 'PRO')     return MODEL_PRO;
  return MODEL_FREE;                               // free = gpt-4o-mini
}

/** Основной хэндлер */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt   = String(body?.prompt || '').trim();
    const history  = (body?.history || []) as ChatMessage[];
    const images   = Array.isArray(body?.images) ? (body.images as string[]) : [];

    if (!prompt && (!images || images.length === 0)) {
      return NextResponse.json({ ok: false, error: 'EMPTY_PROMPT' }, { status: 400 });
    }

    const tgId = resolveTelegramId(req);
    const { tier, userId } = await resolveTierByTgId(tgId);
    const model = pickModelByTier(tier);
    const today = todayStr();

    const mmHistory: ChatMessage[] = toMultimodalHistory(history);
    const userContent = buildUserContent(prompt, images);

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
          { role: 'system', content: [{ type: 'text', text: 'Ты ассистент. Пиши кратко, без Markdown.' }] as any },
          ...mmHistory,
          { role: 'user', content: userContent as any },
        ],
        { model } // gpt-4o-mini
      );

      const answer = cleanAssistantText(raw);

      const resp = NextResponse.json({
        ok: true, answer, model, level: 'FREE',
        limit: FREE_QA_PER_DAY, used: used + 1,
        remaining: Math.max(FREE_QA_PER_DAY - (used + 1), 0),
      });

      const expires = new Date(); expires.setUTCHours(23, 59, 59, 999);
      resp.cookies.set('ai_free_used', String(used + 1), { path: '/', expires });
      resp.cookies.set('ai_free_date', today, { path: '/', expires });
      return resp;
    }

    // ===== PRO / PROPLUS =====
    const limit = tier === 'PROPLUS' ? PROPLUS_QA_PER_DAY : PRO_QA_PER_DAY;
    const used = await prisma.usageDaily.findUnique({
      where: { userId_date: { userId: userId!, date: today } },
      select: { used: true },
    }).then(r => r?.used ?? 0);

    if (used >= limit) {
      return NextResponse.json(
        { ok: false, error: 'DAILY_LIMIT_REACHED', level: tier, limit, used, remaining: 0 },
        { status: 429 },
      );
    }

    const raw = await askAI(
      [
        { role: 'system', content: [{ type: 'text', text: 'Ты ассистент. Пиши развернуто, но без Markdown.' }] as any },
        ...mmHistory,
        { role: 'user', content: userContent as any },
      ],
      { model } // PRO/PRO+ из .env
    );

    const answer = cleanAssistantText(raw);

    await prisma.usageDaily.upsert({
      where: { userId_date: { userId: userId!, date: today } },
      create: { userId: userId!, date: today, used: 1 },
      update: { used: { increment: 1 } },
    });
    const usedNew = used + 1;

    return NextResponse.json({
      ok: true, answer, model, level: tier, limit, used: usedNew,
      remaining: Math.max(limit - usedNew, 0),
    });
  } catch (e: any) {
    const msg = String(e?.message || 'SERVER_ERROR');

    const m = /^AI_HTTP_(\d+):\s*(.*)$/.exec(msg);
    if (m) {
      const status = Number(m[1]);
      const detail = m[2];
      console.error('[AI_ERROR]', { status, detail });
      return NextResponse.json({ ok: false, error: 'AI_ERROR', status, detail }, { status });
    }

    if (msg === 'AI_API_KEY_MISSING') {
      console.error('[AI_ERROR] API key missing');
      return NextResponse.json(
        { ok: false, error: 'AI_API_KEY_MISSING', detail: 'Set AI_API_KEY (or OPENAI_API_KEY) on the server' },
        { status: 500 }
      );
    }

    if (/aborted|timeout/i.test(msg)) {
      console.error('[AI_ERROR] Timeout/Abort:', msg);
      return NextResponse.json({ ok: false, error: 'AI_TIMEOUT', detail: msg }, { status: 504 });
    }

    console.error('[AI_ERROR] Server:', msg);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR', detail: msg }, { status: 500 });
  }
}
