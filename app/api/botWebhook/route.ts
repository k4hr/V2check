// app/api/botWebhook/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { add } from 'date-fns';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, plan } = body;

    let addDuration: Duration;
    switch (plan) {
      case 'WEEK': addDuration = { weeks: 1 }; break;
      case 'MONTH': addDuration = { months: 1 }; break;
      case 'HALFYEAR': addDuration = { months: 6 }; break;
      case 'YEAR': addDuration = { years: 1 }; break;
      default: return NextResponse.json({ ok: false, error: 'INVALID_PLAN' });
    }

    const now = new Date();
    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { subscriptionUntil: true },
    });

    const base = prev?.subscriptionUntil && prev.subscriptionUntil > now ? prev.subscriptionUntil : now;
    const newUntil = add(base, addDuration);

    await prisma.user.upsert({
      where: { telegramId: userId },
      update: { subscriptionUntil: newUntil },
      create: { telegramId: userId, subscriptionUntil: newUntil },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}
