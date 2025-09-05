import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const telegramId = await getTelegramId(req);
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
      }
    });
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
