import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: { id: true, subscriptionUntil: true },
    });

    const now = new Date();
    const active = !!(user.subscriptionUntil && user.subscriptionUntil > now);

    return NextResponse.json({ ok: true, user: { subscriptionUntil: user.subscriptionUntil, active } });
  } catch (e: any) {
    return NextResponse.json({ ok: true, user: { subscriptionUntil: null, active: false }, reason: String(e?.message ?? e) });
  }
}
