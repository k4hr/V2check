import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import add from 'date-fns/add';

type PayloadPlan = 'subs:WEEK' | 'subs:MONTH';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId: string | undefined = body?.successful_payment?.telegramId || body?.userId || body?.telegramId;
    const payload: PayloadPlan | undefined = body?.successful_payment?.payload || body?.payload;
    if (!userId || !payload) return NextResponse.json({ ok: false, error: 'No userId or payload' }, { status: 400 });

    const addDur = payload === 'subs:WEEK' ? { weeks: 1 } : { months: 1 };

    const prev = await prisma.user.findUnique({
      where: { telegramId: String(userId) },
      select: { subscriptionUntil: true },
    });

    const base = prev?.subscriptionUntil && prev.subscriptionUntil > new Date()
      ? prev.subscriptionUntil
      : new Date();

    const newUntil = add(base, addDur);

    await prisma.user.upsert({
      where: { telegramId: String(userId) },
      update: { subscriptionUntil: newUntil },
      create: { telegramId: String(userId), subscriptionUntil: newUntil },
    });

    return NextResponse.json({ ok: true, until: newUntil.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

export const GET = () => NextResponse.json({ ok: true });
