// app/api/assistant/ask/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { askAI, type ChatMessage } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FREE_QA_PER_DAY = Number(process.env.FREE_QA_PER_DAY || 2);

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
  if (mode.startsWith('proplus-')) return MODEL_PRO_PLUS; // Бизнес-план: launch/analysis
  if (mode.startsWith('legal-'))   return MODEL_PRO;      // Юр-режимы
  return MODEL_DEFAULT;
}

function todayStr() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
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

    // Определяем Pro по telegramId (?id=...)
    const { searchParams } = new URL(req.url);
    const tgId = searchParams.get('id');

    let isPro = false;
    if (tgId) {
      const user = await prisma.user.findFirst({
        where: { telegramId: String(tgId) },
        select: { subscriptionUntil: true },
      });
      if (user?.subscriptionUntil && user.subscriptionUntil > new Date()) {
        isPro = true;
      }
    }

    // Бесплатный лимит для не-Pro: cookie
    if (!isPro) {
      const cookies = req.cookies;
      const usedStr = cookies.get('ai_free_used')?.value || '0';
      const dateStr = cookies.get('ai_free_date')?.value || '';
      const today = todayStr();
      let used = Number(usedStr) || 0;

      if (dateStr !== today) used = 0;
      if (used >= FREE_QA_PER_DAY) {
        return NextResponse.json(
          { ok: false, error: 'FREE_LIMIT_REACHED', freeLimit: FREE_QA_PER_DAY },
          { status: 429 }
        );
      }

      const answer = await askAI(
        [
          { role: 'system', content: 'Ты юридический ассистент. Отвечай кратко, по делу, с пошаговыми действиями, без фантазий.' },
          ...history,
          { role: 'user', content: prompt },
        ],
        { model }
      );

      const resp = NextResponse.json({
        ok: true,
        answer,
        model,        // <- вернём модель для дебага
        pro: false,
        freeLimit: FREE_QA_PER_DAY,
        used: used + 1,
      });

      const expires = new Date();
      expires.setUTCHours(23, 59, 59, 999);
      resp.cookies.set('ai_free_used', String(used + 1), { path: '/', expires });
      resp.cookies.set('ai_free_date', today, { path: '/', expires });
      return resp;
    }

    // Pro — безлимит
    const answer = await askAI(
      [
        { role: 'system', content: 'Ты юридический ассистент. Отвечай по делу, структурированно, добавляй шаги и предупреждения.' },
        ...history,
        { role: 'user', content: prompt },
      ],
      { model }
    );

    return NextResponse.json({ ok: true, answer, model, pro: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
