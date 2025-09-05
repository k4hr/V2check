import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function addDuration(from: Date, kind: string): Date {
  const d = new Date(from);
  switch (kind.toUpperCase()) {
    case 'WEEK':     d.setDate(d.getDate() + 7);  break;
    case 'MONTH':    d.setMonth(d.getMonth() + 1); break;
    case 'HALFYEAR': d.setMonth(d.getMonth() + 6); break;
    case 'YEAR':     d.setFullYear(d.getFullYear() + 1); break;
    default:         d.setDate(d.getDate() + 7);
  }
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    // Ожидаем событие Telegram «successful_payment»
    const userId: string | undefined = data?.successful_payment?.telegram_user_id
      ?? data?.userId
      ?? (typeof data?.from?.id !== 'undefined' ? String(data.from.id) : undefined);

    const plan: string | undefined =
      data?.successful_payment?.invoice_payload?.split(':')[1] ??
      data?.payload ??
      data?.plan;

    if (!userId || !plan) {
      return NextResponse.json({ ok: false, error: 'Missing userId or plan' }, { status: 400 });
    }

    // База для продления — максимум из текущей даты и уже существующего срока
    const existing = await prisma.user.findUnique({
      where: { telegramId: String(userId) },
      select: { subscriptionUntil: true },
    });

    const now = new Date();
    const base = existing?.subscriptionUntil && existing.subscriptionUntil > now
      ? existing.subscriptionUntil
      : now;

    const until = addDuration(base, plan);

    await prisma.user.upsert({
      where: { telegramId: String(userId) },
      update: { subscriptionUntil: until },
      create: { telegramId: String(userId), subscriptionUntil: until },
    });

    return NextResponse.json({ ok: true, subscriptionUntil: until.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
  }
}
