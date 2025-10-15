import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';
import { verifyInitData, getTelegramId } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
const ALLOW_BROWSER_DEBUG =
  (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1' ||
  (process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG || '').trim() === '1';

function pickInitData(h: Headers) {
  return (
    h.get('x-init-data') ||
    h.get('X-Init-Data') ||
    h.get('x-tg-init-data') ||
    h.get('X-Tg-Init-Data') ||
    ''
  );
}

async function ensureAdmin(req: NextRequest) {
  const url = new URL(req.url);
  const initData = pickInitData(req.headers) || '';
  if (initData && BOT_TOKEN && verifyInitData(initData, BOT_TOKEN)) {
    const id = getTelegramId(initData);
    return id && ADMIN_TG_IDS.includes(String(id)) ? String(id) : null;
  }
  if (ALLOW_BROWSER_DEBUG) {
    const debugId = url.searchParams.get('id');
    if (debugId && /^\d{3,15}$/.test(debugId) && ADMIN_TG_IDS.includes(String(debugId))) {
      return String(debugId);
    }
  }
  return null;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await ensureAdmin(req);
    if (!adminId) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));

    // ✅ Терпимо читаем ID: telegramId | tgId | id, чистим всё кроме цифр
    const rawAny = String(body?.telegramId ?? body?.tgId ?? body?.id ?? '').trim();
    const cleanId = rawAny.replace(/[^\d]/g, '');
    if (!/^\d{3,15}$/.test(cleanId)) {
      return NextResponse.json({ ok: false, error: 'BAD_TELEGRAM_ID' }, { status: 400 });
    }

    const tier: Tier = resolveTier(body?.tier || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || 'MONTH');
    const extraDays = Math.max(0, Number(body?.extraDays || 0) || 0);

    const baseDays = getPrices(tier)[plan].days;
    const totalDays = baseDays + extraDays;

    // создаём/обновляем пользователя
    const user = await prisma.user.upsert({
      where: { telegramId: cleanId },
      create: { telegramId: cleanId, plan: tier },
      update: { plan: tier },
      select: { id: true, subscriptionUntil: true },
    });

    const now = new Date();
    const from = user.subscriptionUntil && user.subscriptionUntil > now ? user.subscriptionUntil : now;
    const until = addDays(from, totalDays);

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionUntil: until, plan: tier },
    });

    // логируем как подарочный платёж
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: cleanId,
        providerPaymentChargeId: `ADMIN-${adminId}-${Date.now()}`,
        payload: `admin_grant:${tier}:${plan}:${totalDays}`,
        tier, plan,
        amount: 0,
        currency: 'GIFT',
        days: totalDays,
      },
    });

    return NextResponse.json({ ok: true, until, daysGranted: totalDays });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
