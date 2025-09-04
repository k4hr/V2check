import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyInitData } from '@/lib/telegramAuth'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const initData = searchParams.get('initData') ?? req.headers.get('x-init-data');
    if (!initData) throw new Error('UNAUTHORIZED');
    const v: any = await verifyInitData(String(initData));
    if (!v?.ok || !v?.data?.telegramId) throw new Error('UNAUTHORIZED');

    // Create or update user keyed by telegramId (never touch numeric id)
    const user = await prisma.user.upsert({
      where: { telegramId: v.data.telegramId as string },
      update: {},
      create: { telegramId: v.data.telegramId as string },
      select: { telegramId: true, expiresAt: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'ME_ERROR' }, { status: 401 });
  }
}
