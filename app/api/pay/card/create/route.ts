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
  return (kopecks / 100).toFixed(2); // "1234.00"
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const tier = resolveTier(url.searchParams.get('tier')) as Tier;
    const plan = resolvePlan(url.searchParams.get('plan')) as Plan;

    if (!['PRO','PROPLUS'].includes(tier) || !['WEEK','MONTH','HALF_YEAR','YEAR'].includes(plan)) {
      return NextResponse.json({ ok:false, error:'BAD_TIER_OR_PLAN' }, { status: 400 });
    }

    // email из тела — если есть, пробросим в customer
    let email: string | undefined;
    try {
      const body = await req.json().catch(() => ({}));
      const raw = typeof body?.email === 'string' ? body.email.trim() : '';
      if (/\S+@\S+\.\S+/.test(raw)) email = raw;
    } catch {}

    // 1) базовая цена
    const baseK = getVkRubKopecks(tier)[plan];

    // 2) скидка + округление
    const finalK = applyDiscountKopecks(plan, baseK);

    // 3) конфиг ЮKassa
    const shopId = process.env.YK_SHOP_ID!;
    const secret = process.env.YK_SECRET_KEY!;
    const returnBase = process.env.YK_RETURN_URL_BASE || 'https://your-domain.tld';

    if (!shopId || !secret) {
      return NextResponse.json({ ok:false, error:'YKassa env not set' }, { status: 500 });
    }

    // 4) idempotence: «минутные корзины»
    // user-ish база: попробуем взять IP+UA (если нет своей авторизации/ID)
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || req.headers.get('x-real-ip') || '0.0.0.0';
    const ua = req.headers.get('user-agent') || 'ua';
    const minuteBucket = Math.floor(Date.now() / 60000); // стабильный в течение 60 сек
    const idemBase = `${ip}:${ua}:${tier}:${plan}:${minuteBucket}`;
    const idempotenceKey = sha256(idemBase).slice(0, 48); // ЮKassa принимает до 128, нам хватит

    // 5) тело запроса
    const description = `LiveManager ${tier} — ${plan}`;
    const metadata: Record<string, any> = { tier, plan };

    const payload: any = {
      amount: { value: fmtRubValue(finalK), currency: 'RUB' },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `${returnBase}/pay/return`,
      },
      description,
      metadata,
      receipt: {
        customer: email ? { email } : undefined, // если нет — ЮKassa сама спросит на платёжной странице
      },
    };

    // Удалим пустой receipt.customer, чтобы не ругался валидатор
    if (!email) delete payload.receipt;

    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

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
      // Если попали в «already used idempotence key», подскажем фронту, что можно повторить через минуту
      const text = (data?.description || '').toString();
      const alreadyUsed = /already used this idempotence key/i.test(text);
      return NextResponse.json(
        { ok:false, error: text || 'YKassa error', alreadyUsed },
        { status: 400 },
      );
    }

    const urlToPay = data?.confirmation?.confirmation_url as string | undefined;
    if (!urlToPay) {
      return NextResponse.json({ ok:false, error:'NO_CONFIRMATION_URL', details:data }, { status: 400 });
    }

    return NextResponse.json({ ok:true, url: urlToPay });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status: 500 });
  }
}
