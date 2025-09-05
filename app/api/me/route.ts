import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: {
        id: true,
        telegramId: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'ME_FAILED' }, { status: 401 });
  }
}
