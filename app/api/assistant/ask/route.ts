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

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

function pickModelByMode(mode?: string): string {
  if (!mode) return MODEL_DEFAULT;
  if (mode.startsWith('proplus-')) return MODEL_PRO_PLUS; // усиленные режимы для Pro+
  if (mode.startsWith('legal-'))   return MODEL_PRO;      // юр-режимы для Pro
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

/** Определяем Telegram ID:
 *  1) пробуем валидировать x-init-data (из Телеграма)
 *  2) если нет — берём ?id=
 */
function resolveTelegramId(req: NextRequest): string | null {
  // из заголовка (Телеграм WebApp)
  const initData =
    req.headers.get('x-init-data') ||
    req.headers.get('x-tg-init-data') ||
    getInitDataFrom(req as any) || // на всякий случай
    '';
  if (initData && BOT_TOKEN && verifyInitData(initData, BOT_TOKEN)) {
    const id = getTelegramId(initData);
    if (id) return String(id);
  }
  // из query (?id=)
  const { searchParams } = new URL(req.url);
  const qsId = searchParams.get('id');
  if (qsId && /^\d{3,15}$/.test(qsId)) return qsId;
  return null;
}

/* ==================== Vision helpers ==================== */

/** Разрешаем и публичный https, и data:image/*;base64 */
function isValidImageUrl(u?: string): boolean {
  if (!u) return false;
  if (/^data:image\/[a-z0-9+.-]+;base64,/i.test(u)) return true;
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && !!url.hostname;
  } catch { return false; }
}

/** Формируем мультимодальный контент user-сообщения */
function buildUserContent(prompt: string, images?: string[]) {
  const content: any[] = [];
  const text = (prompt || '').trim();
  if (text) content.push({ type: 'text', text });

  const arr = Array.isArray(images) ? images.filter(isValidImageUrl) : [];
  for (const url of arr) {
    content.push({ type: 'input_image', image_url: { url } });
  }

  // Если пусто — вернём пустой текстовый блок (схема API требует непустой content)
  return content.length ? content : [{ type: 'text', text: '' }];
}

/** Конвертируем историю в мультимодальную форму (текстовые блоки) */
function toMultimodalHistory(history: ChatMessage[]): ChatMessage[] {
  return (history || []).map((m) => {
    const txt = typeof m.content === 'string' ? m.content : '';
    return {
      role: m.role,
      content: [{ type: 'text', text: txt }] as any,
    } as ChatMessage;
  });
}

/** Основной хэндлер */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt   = String(body?.prompt || '').trim();
    const history  = (body?.history || []) as ChatMessage[];
    const mode     = String(body?.mode || '');
    const images   = Array.isArray(body?.images) ? (body.images as string[]) : [];
    const model    = pickModelByMode(mode);

    // Разрешаем пустой prompt, если есть хотя бы одна валидная картинка
    const hasValidImages = images.some(isValidImageUrl);
    if (!prompt && !hasValidImages) {
      return NextResponse.json({ ok: false, error: 'EMPTY_PROMPT' }, { status: 400 });
    }

    const tgId = resolveTelegramId(req);
    const { tier, userId } = await resolveTierByTgId(tgId);
    const today = todayStr();

    // Собираем мультимодальные сообщения
    const mmHistory: ChatMessage[] = toMultimodalHistory(history);
    const userContent = buildUserContent(prompt, images);

    // ===== FREE: считаем лимит куками =====
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
    const used = await getUsedToday(userId!, today);

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
    const msg = String(e?.message || 'SERVER_ERROR');

    // Парсим ошибки из lib/ai.ts вида "AI_HTTP_429: …"
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
}
