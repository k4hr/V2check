// app/api/assistant/ask/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { askAI, type ChatMessage } from '@/lib/ai';
import { prisma } from '@/lib/prisma';
import {
  todayUTC,
  getUserTier,
  getDailyLimitByTier,
  enforceByTier,
  checkAndCountDailyUsage,
  type Tier,
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
  MODEL_PRO;

function pickModelByMode(mode?: string): string {
  if (!mode) return MODEL_DEFAULT;
  if (mode.startsWith('proplus-')) return MODEL_PRO_PLUS; // Pro+
  if (mode.startsWith('legal-'))   return MODEL_PRO;      // пример режима
  if (mode.startsWith('pro-'))     return MODEL_PRO;      // Pro
  return MODEL_DEFAULT;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    const history = (body?.history || []) as ChatMessage[];
    const mode = String(body?.mode || '');
    const model = pickModelByMode(mode);

    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'EMPTY_PROMPT' }, { status: 400 });
    }

    // Telegram ID из query (?id=...)
    const { searchParams } = new URL(req.url);
    const tgId = searchParams.get('id');
    const userId = tgId ? String(tgId) : null;

    // Тариф и лимиты
    let tier: Tier = 'FREE';
    if (userId) tier = await getUserTier(prisma, userId);

    const limit = getDailyLimitByTier(tier);
    const enforce = enforceByTier(tier);

    // Учёт/ограничение запросов (по пользователю); если userId отсутствует — пропускаем
    let used = 0;
    if (userId) {
      const res = await checkAndCountDailyUsage(prisma, userId, limit, enforce);
      used = res.used;
      if (!res.ok && res.reached) {
        // для совместимости с фронтом — тот же код ошибки
        return NextResponse.json(
          { ok: false, error: 'FREE_LIMIT_REACHED', freeLimit: limit, used, date: todayUTC() },
          { status: 429 }
        );
      }
    }

    // Запрос к модели — используем историю как прислали со страницы (system уже внутри)
    const answer = await askAI(history, { model });

    return NextResponse.json({
      ok: true,
      answer,
      model,
      tier,
      pro: tier !== 'FREE',
      limit,
      used,
      date: todayUTC(),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
