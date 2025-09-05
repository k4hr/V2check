import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Ожидается тело вида:
 * { userId: '1177339433', payload: 'subs:WEEK' }
 * В логах у тебя такое уже приходило.
 */
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const userId: string = String(data?.userId ?? '');
    const payload: string = String(data?.payload ?? '');

    if (!userId || !payload.startsWith('subs:')) {
      return NextResponse.json({ ok: false, error: 'BAD_PAYLOAD' }, { status: 400 });
    }

    const kind = payload.split(':')[1]; // WEEK / MONTH / YEAR и т.п.

    const now = new Date();
    const prev = await prisma.user.findUnique({ where: { telegramId: userId } });
    // базовая точка продления — большее из now и текущего until/expired
    let base = now;
    const prevUntilRaw: any = (prev as any)?.subscriptionUntil ?? (prev as any)?.expiresAt;
    if (prevUntilRaw) {
      const prevUntil = new Date(prevUntilRaw);
      if (!Number.isNaN(prevUntil.getTime()) && prevUntil > now) base = prevUntil;
    }

    let addDays = 7;
    if (kind === 'MONTH') addDays = 31;
    if (kind === 'YEAR') addDays = 365;

    const until = new Date(base.getTime() + addDays * 24 * 60 * 60 * 1000);

    await prisma.user.upsert({
      where: { telegramId: userId },
      update: { subscriptionUntil: until },
      create: { telegramId: userId, subscriptionUntil: until },
    });

    return NextResponse.json({ ok: true, subscriptionUntil: until.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'WEBHOOK_FAILED' }, { status: 500 });
  }
}