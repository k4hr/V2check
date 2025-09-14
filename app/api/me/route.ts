// app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyInitData,
  getInitDataFrom,
  getTelegramIdStrict,
} from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING' },
        { status: 500 },
      );
    }

    // Берём initData без чтения body (см. lib/auth/verifyInitData.ts)
    const initData = getInitDataFrom(req);
    if (!initData) {
      return NextResponse.json(
        { ok: true, subscription: null }, // не авторизован — отвечаем стабильно
      );
    }

    // Строгая boolean-валидация
    const valid = verifyInitData(initData, BOT_TOKEN);
    if (!valid) {
      return NextResponse.json({ ok: true, subscription: null });
    }

    // Получаем Telegram ID
    let telegramId = '';
    try {
      telegramId = getTelegramIdStrict(initData);
    } catch {
      return NextResponse.json({ ok: true, subscription: null });
    }

    // Пользователь и статус подписки
    const user = await prisma.user.findUnique({ where: { telegramId } });
    const now = new Date();

    if (!user || !user.subscriptionUntil || user.subscriptionUntil <= now) {
      return NextResponse.json({ ok: true, subscription: null });
    }

    return NextResponse.json({
      ok: true,
      subscription: {
        active: true,
        expiresAt: user.subscriptionUntil.toISOString(),
      },
    });
  } catch (e: any) {
    // Даже при исключениях отдаём стабильную форму — чтобы клиент не падал в catch
    return NextResponse.json(
      { ok: true, subscription: null, error: e?.message },
      { status: 200 },
    );
  }
}

// опционально: поддержим GET тем же поведением (удобно для тестов)
export const GET = POST;
