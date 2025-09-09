// app/api/botWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramIdStrict } from '@/lib/auth';

function addDuration(base: Date, add: 'week' | 'month' | 'half' | 'year') {
  const d = new Date(base);
  switch (add) {
    case 'week':  d.setDate(d.getDate() + 7);  break;
    case 'month': d.setMonth(d.getMonth() + 1); break;
    case 'half':  d.setMonth(d.getMonth() + 6); break;
    case 'year':  d.setFullYear(d.getFullYear() + 1); break;
  }
  return d;
}

export async function POST(req: NextRequest) {
  try {
    const add = (req.nextUrl.searchParams.get('add') ?? 'month') as
      | 'week' | 'month' | 'half' | 'year';

    const telegramId = await getTelegramIdStrict(req);

    const prev = await prisma.user.findUnique({
      where: { telegramId },
      select: { subscriptionUntil: true },
    });

    const now = new Date();
    const base = prev?.subscriptionUntil && prev.subscriptionUntil > now
      ? prev.subscriptionUntil
      : now;

    const until = addDuration(base, add);

    await prisma.user.upsert({
      where: { telegramId },
      update: { subscriptionUntil: until },
      create: { telegramId, subscriptionUntil: until },
    });

    return NextResponse.json({ ok: true, subscriptionUntil: until });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}
