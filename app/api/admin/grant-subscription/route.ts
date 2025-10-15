import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Проверяем, что запрос пришёл от админа — дергаем уже готовый /api/admin/check */
async function ensureAdmin(req: NextRequest): Promise<boolean> {
  try {
    const origin = new URL(req.url).origin;
    const debugId = new URL(req.url).searchParams.get('id') || '';
    const init = req.headers.get('x-init-data') || '';

    const url = `${origin}/api/admin/check${(!init && debugId) ? `?id=${encodeURIComponent(debugId)}` : ''}`;
    const r = await fetch(url, {
      method: 'GET',
      headers: init ? { 'x-init-data': init } : {},
      cache: 'no-store',
    });
    const j = await r.json().catch(() => ({}));
    return Boolean(j?.admin);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdmin = await ensureAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({} as any));
    const tgIdRaw = String(body?.tgId || '').trim();
    const tier: Tier = resolveTier(body?.tier || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || 'MONTH');
    const extraDays = Number(body?.extraDays || 0);

    if (!tgIdRaw || !/^\d{3,15}$/.test(tgIdRaw)) {
      return NextResponse.json({ ok: false, error: 'BAD_TG_ID' }, { status: 400 });
    }

    // вычисляем дни по плану + доп. дни
    const baseDays = getPrices(tier)[plan].days;
    const days = baseDays + (Number.isFinite(extraDays) ? Math.max(0, extraDays) : 0);

    // создаём/находим пользователя
    const user = await prisma.user.upsert({
      where: { telegramId: tgIdRaw },
      create: { telegramId: tgIdRaw, plan: tier },
      update: { plan: tier },
      select: { id: true, subscriptionUntil: true },
    });

    const now = new Date();
    const from = user.subscriptionUntil && user.subscriptionUntil > now ? user.subscriptionUntil : now;
    const until = addDays(from, days);

    // логируем «платёж» как админскую выдачу
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: tgIdRaw,
        payload: 'admin:grant',
        tier,
        plan,
        amount: 0,                 // бесплатная выдача
        currency: 'ADMIN',         // помечаем источник
        days,
        providerPaymentChargeId: `ADMIN-${Date.now()}`,
      },
    });

    // продлеваем подписку
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionUntil: until, plan: tier },
    });

    return NextResponse.json({
      ok: true,
      until: until.toISOString(),
      tier,
      plan,
      days,
      userId: user.id,
      telegramId: tgIdRaw,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
