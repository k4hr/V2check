import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function addMonths(base: Date, months: number) {
  const d = new Date(base);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}
function addWeeks(base: Date, weeks: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}
function addYears(base: Date, years: number) {
  return addMonths(base, years * 12);
}
function parsePlan(payload?: string) {
  const raw = (payload ?? '').split(':')[1]?.trim().toUpperCase();
  switch (raw) {
    case 'WEEK':       return { kind: 'weeks'  as const, value: 1 };
    case 'MONTH':      return { kind: 'months' as const, value: 1 };
    case 'HALF_YEAR':
    case 'HALFYEAR':
    case 'SIX_MONTH':
    case 'SIX_MONTHS':
    case '6M':         return { kind: 'months' as const, value: 6 };
    case 'YEAR':       return { kind: 'years'  as const, value: 1 };
    default:           return null;
  }
}
function addInterval(base: Date, plan: { kind: 'weeks'|'months'|'years'; value: number }) {
  if (plan.kind === 'weeks')  return addWeeks(base, plan.value);
  if (plan.kind === 'months') return addMonths(base, plan.value);
  return addYears(base, plan.value);
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const msg = update?.message;
    const sp = msg?.successful_payment;
    if (!sp) return NextResponse.json({ ok: true, skip: true });

    const userId = String(msg?.from?.id ?? '');
    if (!userId) return NextResponse.json({ ok: false, error: 'no user' }, { status: 400 });

    const plan = parsePlan(msg?.invoice_payload);
    if (!plan) return NextResponse.json({ ok: true, ignored: true });

    const now = new Date();
    const prev = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: { subscriptionUntil: true },
    });
    const base = prev?.subscriptionUntil && prev.subscriptionUntil > now ? prev.subscriptionUntil : now;
    const until = addInterval(base, plan);

    await prisma.user.upsert({
      where: { telegramId: userId },
      update: { subscriptionUntil: until },
      create: { telegramId: userId, subscriptionUntil: until },
    });

    return NextResponse.json({ ok: true, until });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 200 });
  }
}
