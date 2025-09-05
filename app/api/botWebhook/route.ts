// app/api/botWebhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

// Мини-хелпер: прибавить дни/недели/месяцы без сторонних зависимостей
function addDuration(base: Date, opts: { days?: number; weeks?: number; months?: number }) {
  const d = new Date(base);
  if (opts.days)   d.setDate(d.getDate() + opts.days);
  if (opts.weeks)  d.setDate(d.getDate() + opts.weeks * 7);
  if (opts.months) d.setMonth(d.getMonth() + opts.months);
  return d;
}

type TgSuccessfulPayment = {
  invoice_payload?: string; // например: "subs:WEEK"
};

type TgMessage = {
  from?: { id: number };
  successful_payment?: TgSuccessfulPayment;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const msg: TgMessage | undefined = body?.message;

    const payment = msg?.successful_payment;
    const userId = msg?.from?.id ? String(msg.from.id) : undefined;

    if (!payment || !userId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // из payload берём план (по твоей логике "subs:WEEK" | "subs:MONTH" | "subs:YEAR")
    const planKey = payment.invoice_payload?.split(':')[1] ?? 'WEEK';

    // сопоставляем длительность
    let toAdd: { days?: number; weeks?: number; months?: number } = {};
    switch (planKey) {
      case 'WEEK':
        toAdd = { weeks: 1 };
        break;
      case 'MONTH':
        toAdd = { months: 1 };
        break;
      case 'YEAR':
        toAdd = { months: 12 };
        break;
      default:
        toAdd = { weeks: 1 };
        break;
    }

    const now = new Date();

    // читаем текущий срок подписки
    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { expiresAt: true }, // ⚠️ имя поля должно совпадать с твоей Prisma-схемой
    });

    // если подписка ещё активна — продлеваем от неё, иначе от "сейчас"
    const base = prev?.expiresAt && prev.expiresAt > now ? prev.expiresAt : now;
    const newUntil = addDuration(base, toAdd);

    // апсертом создаём/обновляем пользователя и срок подписки
    await prisma.user.upsert({
      where: { telegramId: userId },
      create: { telegramId: userId, expiresAt: newUntil },
      update: { expiresAt: newUntil },
    });

    return NextResponse.json({ ok: true, userId, plan: planKey, until: newUntil.toISOString() });
  } catch (e: any) {
    console.error('[botWebhook] error:', e);
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
