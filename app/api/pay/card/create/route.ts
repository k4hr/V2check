/* path: app/api/pay/card/create/route.ts */
import { NextResponse } from 'next/server';
import { getVkRubKopecks, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const DISCOUNT: Partial<Record<Plan, number>> = {
  MONTH: 0.30,
  HALF_YEAR: 0.50,
  YEAR: 0.70,
};

function roundDownToNine(rub: number): number {
  if (rub <= 9) return 9;
  return Math.floor((rub - 9) / 10) * 10 + 9;
}

function applyDiscountKopecks(plan: Plan, baseKopecks: number): number {
  const baseRub = Math.floor(baseKopecks / 100);
  const d = DISCOUNT[plan] ?? 0;
  if (!d) return baseKopecks;
  const discountedRub = roundDownToNine(Math.max(1, Math.floor(baseRub * (1 - d))));
  return discountedRub * 100;
}

function fmtRubValue(kopecks: number): string {
  // строка вида "1234.00"
  return (kopecks / 100).toFixed(2);
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const tier = resolveTier(url.searchParams.get('tier')) as Tier;
    const plan = resolvePlan(url.searchParams.get('plan')) as Plan;

    if (!['PRO','PROPLUS'].includes(tier) || !['WEEK','MONTH','HALF_YEAR','YEAR'].includes(plan))
      return NextResponse.json({ ok:false, error:'BAD_TIER_OR_PLAN' }, { status: 400 });

    // 1) базовая цена в копейках из твоего прайсинга
    const base = getVkRubKopecks(tier)[plan];

    // 2) серверная скидка + округление до “…9”
    const finalKopecks = applyDiscountKopecks(plan, base);

    // 3) подготовка платежа
    const shopId = process.env.YK_SHOP_ID!;
    const secret = process.env.YK_SECRET_KEY!;
    const returnBase = process.env.YK_RETURN_URL_BASE || 'https://your-domain.tld';

    if (!shopId || !secret) {
      return NextResponse.json({ ok:false, error:'YKassa env not set' }, { status: 500 });
    }

    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');
    const idempotenceKey = crypto.randomUUID();

    // опциональная мета — под себя
    const description = `LiveManager ${tier} — ${plan}`;
    const metadata = { tier, plan /* , userId, tg: ..., etc. */ };

    const payload = {
      amount: { value: fmtRubValue(finalKopecks), currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${returnBase}/pay/return`, // страница “спасибо”/редирект в кабинет
      },
      description,
      metadata,
    };

    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ ok:false, error:data?.description || 'YKassa error', details:data }, { status: 400 });
    }

    const urlToPay = data?.confirmation?.confirmation_url as string | undefined;
    if (!urlToPay) {
      return NextResponse.json({ ok:false, error:'NO_CONFIRMATION_URL', details:data }, { status: 400 });
    }

    return NextResponse.json({ ok:true, url:urlToPay });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status: 500 });
  }
}
