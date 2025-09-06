// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramId } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'NO_TELEGRAM_ID' }, { status: 401 });
    }

    await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { subscriptionUntil: true },
    });

    const now = new Date();
    const until = user?.subscriptionUntil ?? null;
    const active = !!(until && until > now);

    return NextResponse.json({ ok: true, subscription: { active, until } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
