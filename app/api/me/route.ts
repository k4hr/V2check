// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramId } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'TELEGRAM_ID_NOT_FOUND' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        telegramId: true,
        subscriptionUntil: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e) {
    console.error('ME error', e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' });
  }
}
