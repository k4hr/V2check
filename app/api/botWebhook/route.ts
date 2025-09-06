// app/api/botWebhook/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { addDays, addMonths, addYears } from 'date-fns';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, payload } = body;

    if (!userId || !payload) {
      return NextResponse.json({ ok: false, error: 'MISSING_PARAMS' });
    }

    const now = new Date();

    let add: Date;
    switch (payload) {
      case 'subs:WEEK':
        add = addDays(now, 7);
        break;
      case 'subs:MONTH':
        add = addMonths(now, 1);
        break;
      case 'subs:HALFYEAR':
        add = addMonths(now, 6);
        break;
      case 'subs:YEAR':
        add = addYears(now, 1);
        break;
      default:
        return NextResponse.json({ ok: false, error: 'UNKNOWN_PLAN' });
    }

    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { subscriptionUntil: true },
    });

    const base =
      prev?.subscriptionUntil && prev.subscriptionUntil > now
        ? prev.subscriptionUntil
        : now;

    const newUntil = add;

    await prisma.user.upsert({
      where: { telegramId: userId },
      update: { subscriptionUntil: newUntil },
      create: { telegramId: userId, subscriptionUntil: newUntil },
    });

    return NextResponse.json({ ok: true, until: newUntil });
  } catch (e) {
    console.error('Webhook error', e);
    return NextResponse.json({ ok: false, error: 'SERVER_ERROR' });
  }
}
