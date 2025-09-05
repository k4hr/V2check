// Handle Telegram Bot webhook updates to apply subscription extensions
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function addDuration(base: Date, opts: { days?: number; weeks?: number; months?: number }) {
  const d = new Date(base);
  if (opts.days)   d.setDate(d.getDate() + opts.days);
  if (opts.weeks)  d.setDate(d.getDate() + opts.weeks * 7);
  if (opts.months) d.setMonth(d.getMonth() + opts.months);
  return d;
}

type TgSuccessfulPayment = {
  invoice_payload?: string; // e.g. "subs:WEEK"
};

type TgMessage = {
  from?: { id: number };
  successful_payment?: TgSuccessfulPayment;
};

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg: TgMessage | undefined = update?.message;
    const payment = msg?.successful_payment;
    const userId = msg?.from?.id ? String(msg.from.id) : undefined;

    if (!payment || !userId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const planKey = String(payment.invoice_payload ?? '').split(':')[1] ?? 'WEEK';

    let add: { days?: number; weeks?: number; months?: number } = {};
    switch (planKey) {
      case 'WEEK':
        add = { weeks: 1 }; break;
      case 'MONTH':
        add = { months: 1 }; break;
      case 'YEAR':
        add = { months: 12 }; break;
      default:
        add = { weeks: 1 }; break;
    }

    const now = new Date();
    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { expiresAt: true },
    });
    const base = prev?.expiresAt && prev.expiresAt > now ? prev.expiresAt : now;
    const newUntil = addDuration(base, add);

    await prisma.user.upsert({
      where: { telegramId: userId },
      create: { telegramId: userId, expiresAt: newUntil },
      update: { expiresAt: newUntil },
    });

    return NextResponse.json({ ok: true, plan: planKey, until: newUntil.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'WEBHOOK_ERROR' }, { status: 500 });
  }
}
