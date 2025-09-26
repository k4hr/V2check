// app/api/assistant/ask/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { askAI, type ChatMessage } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// === Константы/ENV ===
// Для обратной совместимости используем OPENAI_MODEL, если новые переменные не заданы.
const {
  OPENAI_MODEL,               // старое поле (fallback)
  OPENAI_MODEL_DEFAULT,       // базовая модель (например, "gpt-4o-mini")
  OPENAI_MODEL_PRO,           // модель для Pro (например, "gpt-4o-mini")
  OPENAI_MODEL_PRO_PLUS,      // модель для Pro+ (например, "gpt-4o")
} = process.env;

const FREE_QA_PER_DAY = Number(process.env.FREE_QA_PER_DAY || 2);

// ===== helpers =====
function todayStr() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getCookie(req: NextRequest, name: string): string {
  try {
    return req.cookies.get(name)?.value ?? '';
  } catch { return ''; }
}

/** Выбор модели: по mode -> Pro+, Pro, иначе default. */
function pickModel(mode: string, isPro: boolean): string {
  // Pro+ страницы (ваши /pro-plus/*) передают mode, начинающийся с "proplus-"
  if (/^proplus-/.test(mode)) {
    // Если хотите жёстко требовать отдельную подписку Pro+ — тут же можно проверять,
    // но в текущей БД нет отдельного поля, поэтому пока используем ту же подписку, что и Pro.
    return OPENAI_MODEL_PRO_PLUS || OPENAI_MODEL_PRO || OPENAI_MODEL_DEFAULT || OPENAI_MODEL || 'gpt-4o';
  }

  // Юр-режимы (обычная Pro)
  if (/^legal-/.test(mode)) {
    return OPENAI_MODEL_PRO || OPENAI_MODEL_DEFAULT || OPENAI_MODEL || 'gpt-4o-mini';
  }

  // По умолчанию
  // Если пользователь не Pro — всё равно используем базовую дешёвую модель.
  return OPENAI_MODEL_DEFAULT || OPENAI_MODEL || 'gpt-4o-mini';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    const history = (Array.isArray(body?.history) ? body.history : []) as ChatMessage[];
    const mode = String(body?.mode || 'default');
    const systemFromClient = typeof body?.system === 'string' ? String(body.system) : '';

    if (!prompt) {
      return NextResponse.json({ ok: false, error: 'EMPTY_PROMPT' }, { status: 400 });
    }

    // Берём telegramId из query (?id=...), как у вас в /api/me
    const { searchParams } = new URL(req.url);
    const tgId = searchParams.get('id');

    // Проверка подписки Pro (как было у вас — по полю user.subscriptionUntil)
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

    // Язык интерфейса — берём из cookie 'locale'
    const locale = (getCookie(req, 'locale') || 'ru').toLowerCase();

    // Соберём системный промпт: ваш + принудительная приписка про язык
    const systemNote = `SYSTEM NOTE: Reply strictly in language "${locale}".`;
    const system = systemFromClient
      ? `${systemFromClient}\n\n${systemNote}`
      : `Ты юридический ассистент. Отвечай по делу, структурированно, добавляй шаги и предупреждения.\n\n${systemNote}`;

    // Общая история: не раздуваем (оставим последние 12 сообщений)
    const safeHistory = history
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12);

    // Выберем модель (от mode и статуса Pro)
    const modelToUse = pickModel(mode, isPro);

    // === Не-Pro: бесплатный лимит по cookie (как у вас было) ===
    if (!isPro) {
      const usedStr = getCookie(req, 'ai_free_used') || '0';
      const dateStr = getCookie(req, 'ai_free_date') || '';
      const today = todayStr();
      let used = Number(usedStr) || 0;

      if (dateStr !== today) used = 0;
      if (used >= FREE_QA_PER_DAY) {
        return NextResponse.json({ ok: false, error: 'FREE_LIMIT_REACHED', freeLimit: FREE_QA_PER_DAY }, { status: 429 });
      }

      const answer = await askAI(
        [{ role: 'system', content: system }, ...safeHistory, { role: 'user', content: prompt }],
        { model: modelToUse }
      );

      const resp = NextResponse.json({
        ok: true,
        answer,
        pro: false,
        model: modelToUse,
        freeLimit: FREE_QA_PER_DAY,
        used: used + 1,
      });

      // поставим cookie до конца суток (UTC)
      const expires = new Date();
      expires.setUTCHours(23, 59, 59, 999);
      resp.cookies.set('ai_free_used', String(used + 1), { path: '/', expires });
      resp.cookies.set('ai_free_date', today, { path: '/', expires });

      return resp;
    }

    // === Pro (и временно Pro+) — безлимит, но с выбранной моделью по mode ===
    const answer = await askAI(
      [{ role: 'system', content: system }, ...safeHistory, { role: 'user', content: prompt }],
      { model: modelToUse }
    );

    return NextResponse.json({ ok: true, answer, pro: true, model: modelToUse });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
