// app/api/me/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramId } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);

    // гарантируем наличие пользователя
    await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });

    const me = await prisma.user.findUnique({
      where: { telegramId },
      select: { telegramId: true, subscriptionUntil: true },
    });

    return NextResponse.json({ ok: true, me });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'ME_FETCH_FAILED', details: String(e?.message ?? e) }, { status: 500 });
  }
}
