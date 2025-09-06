// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramId } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const telegramId = await (getTelegramId as any)(req);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'TELEGRAM_ID_NOT_FOUND' }, { status: 401 });
    }

    // гарантируем наличие записи пользователя
    await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { telegramId: true, subscriptionUntil: true },
    });

    const until = user?.subscriptionUntil ?? null;
    const isActive = !!(until && until > new Date());

    return NextResponse.json({
      ok: true,
      user: {
        telegramId: user?.telegramId ?? telegramId,
        subscriptionUntil: until ? until.toISOString() : null,
        isActive,
      },
    });
  } catch (e: any) {
    console.error('[me] error:', e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
