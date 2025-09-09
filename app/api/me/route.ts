// app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) {
      return NextResponse.json({
        ok: true,
        user: null,
        subscription: { active: false, until: null },
        reason: 'NO_TELEGRAM_ID',
      });
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: {
        id: true,
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        subscriptionUntil: true,
      },
    });

    const now = new Date();
    const active = !!(user.subscriptionUntil && user.subscriptionUntil > now);

    return NextResponse.json({
      ok: true,
      user,
      subscription: {
        active,
        until: user.subscriptionUntil,
        daysLeft: active
          ? Math.ceil((user.subscriptionUntil!.getTime() - now.getTime()) / 86_400_000)
          : 0,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
