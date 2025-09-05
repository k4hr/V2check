// app/api/botWebhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { add } from 'date-fns';
import { PRICES } from '@/lib/pricing'; // если у тебя другой путь — оставь как есть в проекте

type TgSuccessfulPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string; // например: "subs:WEEK"
};

type TgMessage = {
  from?: { id: number };
  successful_payment?: TgSuccessfulPayment;
};

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const msg: TgMessage | undefined = body?.message;

    const payment = msg?.successful_payment;
    const userId = msg?.from?.id ? String(msg.from.id) : undefined;

    if (!payment || !userId) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    // payload вида "subs:WEEK"
    const planKey = payment.invoice_payload?.split(':')[1] ?? 'WEEK';

    // сколько продлеваем (по твоей таблице PRICES)
    // допустим, там есть WEEK | MONTH | YEAR
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

    // читаем предыдущую дату окончания
    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { expiresAt: true }, // ВАЖНО: имя совпадает со схемой
    });

    let base = now;
    if (prev?.expiresAt && prev.expiresAt > now) {
      base = prev.expiresAt;
    }

    const newUntil = add(base, toAdd);

    // апсёрт пользователя и продление подписки
    await prisma.user.upsert({
      where: { telegramId: userId },
      create: {
        telegramId: userId,
        expiresAt: newUntil, // имя поля из схемы
      },
      update: {
        expiresAt: newUntil,
      },
    });

    return NextResponse.json({
      ok: true,
      userId,
      plan: planKey,
      until: newUntil.toISOString(),
    });
  } catch (e: any) {
    console.error('[botWebhook] error:', e);
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
