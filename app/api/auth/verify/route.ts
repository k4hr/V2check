import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';

// Пытаемся использовать ваш существующий helper для верификации initData
// Оставляем прежний путь импорта, чтобы не ломать структуру проекта.
import { verifyInitData } from '../../../../lib/auth/verifyInitData';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const initData: string | undefined =
      body?.initData ||
      req.headers.get('x-init-data') ||
      undefined;

    if (!initData) {
      return NextResponse.json({ ok: false, error: 'Missing initData' }, { status: 400 });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'Missing BOT_TOKEN' }, { status: 500 });
    }

    // Валидация Telegram initData
    const verified = await verifyInitData(initData, botToken);
    if (!verified || (typeof verified === 'object' && 'ok' in verified && !verified.ok)) {
      return NextResponse.json({ ok: false, error: 'Invalid initData' }, { status: 401 });
    }

    // Извлекаем user из initDataUnsafe (внутри verifyInitData обычно уже разобрано)
    // На всякий случай парсим из search-строки сами.
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    const user = userStr ? JSON.parse(userStr) : undefined;

    if (!user?.id) {
      return NextResponse.json({ ok: false, error: 'No user in initData' }, { status: 400 });
    }

    const data = {
      telegramId: String(user.id),
      username: user.username || null,
      firstName: user.first_name || null,
      lastName: user.last_name || null,
      photoUrl: user.photo_url || null,
    };

    const dbUser = await prisma.user.upsert({
      where: { telegramId: data.telegramId },
      update: data,
      create: { id: undefined as any, ...data } as any,
    });

    return NextResponse.json({ ok: true, user: dbUser });
  } catch (e: any) {
    console.error('auth/verify error', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
