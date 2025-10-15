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
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

async function ensureAdmin(req: NextRequest) {
  const url = new URL(req.url);
  // 1) initData из заголовка
  const initData = pickInitData(req.headers) || '';
  if (initData && BOT_TOKEN && verifyInitData(initData, BOT_TOKEN)) {
    const adminId = getTelegramId(initData);
    return adminId && ADMIN_TG_IDS.includes(String(adminId)) ? String(adminId) : null;
  }
  // 2) debug режим (только если разрешён)
  if (ALLOW_BROWSER_DEBUG) {
    const debugId = url.searchParams.get('id');
    if (debugId && /^\d{3,15}$/.test(debugId) && ADMIN_TG_IDS.includes(String(debugId))) {
      return String(debugId);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await ensureAdmin(req);
    if (!adminId) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const rawTgId = String(body?.telegramId || '').trim();
    const tier: Tier = resolveTier(body?.tier || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || 'MONTH');
    const extraDays = Math.max(0, Number(body?.extraDays || 0) || 0);

    if (!/^\d{3,15}$/.test(rawTgId)) {
      return NextResponse.json({ ok: false, error: 'BAD_TELEGRAM_ID' }, { status: 400 });
    }

    const baseDays = getPrices(tier)[plan].days;
    const totalDays = baseDays + extraDays;

    // создать/обновить пользователя
    const user = await prisma.user.upsert({
      where: { telegramId: rawTgId },
      create: { telegramId: rawTgId, plan: tier },
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

    // лог «платежа» как подарочного
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: rawTgId,
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
