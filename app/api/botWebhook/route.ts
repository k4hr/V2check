// app/api/botWebhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// добавление интервалов без сторонних либ
function addDuration(base: Date, opts: { days?: number; months?: number; years?: number }) {
  const d = new Date(base);
  if (opts.years)  d.setFullYear(d.getFullYear() + (opts.years || 0));
  if (opts.months) d.setMonth(d.getMonth() + (opts.months || 0));
  if (opts.days)   d.setDate(d.getDate() + (opts.days || 0));
  return d;
}

export async function POST(req: NextRequest) {
  try {
    // Поддерживаем 2 формата тела:
    // 1) real Telegram webhook (message.successful_payment)
    // 2) прокси-вызов { userId, payload } — удобно для теста
    const update = await req.json();

    const sp = update?.message?.successful_payment;
    const userId: string | undefined =
      sp ? String(update?.message?.from?.id || '') : String(update?.userId || '');
    const payload: string | undefined =
      sp ? String(sp?.invoice_payload || '')       : String(update?.payload || '');

    if (!userId || !payload) {
      return NextResponse.json({ ok: false, error: 'MISSING_PARAMS' }, { status: 400 });
    }

    // ожидаем payload вида: "subs:WEEK|MONTH|HALFYEAR|YEAR"
    const plan = payload.split(':')[1]?.toUpperCase();
    if (!plan) {
      return NextResponse.json({ ok: false, error: 'UNKNOWN_PLAN' }, { status: 400 });
    }

    // берём базовую точку продления — максимальная из (сейчас, текущий срок)
    const now = new Date();
    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { subscriptionUntil: true },
    });
    const base = prev?.subscriptionUntil && prev.subscriptionUntil > now ? prev.subscriptionUntil : now;

    let newUntil: Date;
    switch (plan) {
      case 'WEEK':     newUntil = addDuration(base, { days: 7 }); break;
      case 'MONTH':    newUntil = addDuration(base, { months: 1 }); break;
      case 'HALFYEAR': newUntil = addDuration(base, { months: 6 }); break;
      case 'YEAR':     newUntil = addDuration(base, { years: 1 }); break;
      default:
        return NextResponse.json({ ok: false, error: 'UNKNOWN_PLAN' }, { status: 400 });
    }

    await prisma.user.upsert({
      where:  { telegramId: userId },
      update: { subscriptionUntil: newUntil },
      create: { telegramId: userId, subscriptionUntil: newUntil },
    });

    return NextResponse.json({ ok: true, subscriptionUntil: newUntil.toISOString() });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
