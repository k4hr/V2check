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

function roundDownToNine(rub: number) {
  if (rub <= 9) return 9;
  return Math.floor((rub - 9) / 10) * 10 + 9;
}
function applyDiscountKopecks(plan: Plan, baseK: number) {
  const d = DISCOUNT[plan] ?? 0;
  if (!d) return baseK;
  const rub = Math.floor(baseK / 100);
  return roundDownToNine(Math.max(1, Math.floor(rub * (1 - d)))) * 100;
}
const fmt = (k: number) => (k / 100).toFixed(2);
const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

function getOrigin(req: Request): string {
  try {
    const u = new URL(req.url);
    const proto = (req.headers.get('x-forwarded-proto') || u.protocol.replace(':', '')).toLowerCase();
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || u.host;
    return `${proto}://${host}`;
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const tier = resolveTier(url.searchParams.get('tier')) as Tier;
    const plan = resolvePlan(url.searchParams.get('plan')) as Plan;

    if (!['PRO', 'PROPLUS'].includes(tier) || !['WEEK', 'MONTH', 'HALF_YEAR', 'YEAR'].includes(plan)) {
      return NextResponse.json({ ok: false, error: 'BAD_TIER_OR_PLAN' }, { status: 400 });
    }

    // Доп. данные из тела (для чека и идентификации пользователя в вебхуке)
    let email: string | undefined;
    let userId: string | undefined;
    let telegramId: string | undefined;
    try {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.email === 'string' && /\S+@\S+\.\S+/.test(body.email)) email = body.email.trim();
      if (typeof body?.userId === 'string') userId = body.userId;
      if (typeof body?.telegramId === 'string') telegramId = body.telegramId;
    } catch {}

    const baseK = getVkRubKopecks(tier)[plan];
    const finalK = applyDiscountKopecks(plan, baseK);

    const shopId = process.env.YK_SHOP_ID!;
    const secret = process.env.YK_SECRET_KEY!;
    const envBase = (process.env.YK_RETURN_URL_BASE ||
      process.env.APP_ORIGIN ||
      process.env.NEXT_PUBLIC_APP_ORIGIN ||
      ''
    ).replace(/\/+$/, '');
    const returnBase = envBase || getOrigin(req);

    if (!shopId || !secret || !returnBase) {
      return NextResponse.json(
        { ok: false, error: 'YKassa env not set (SHOP_ID/SECRET/RETURN_BASE)' },
        { status: 500 }
      );
    }

    // Идемпотентность: «минутная корзина»
    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0] || req.headers.get('x-real-ip') || '0.0.0.0';
    const ua = req.headers.get('user-agent') || 'ua';
    const minuteBucket = Math.floor(Date.now() / 60000);
    const idempotenceKey = sha256(`${ip}:${ua}:${tier}:${plan}:${minuteBucket}`).slice(0, 48);

    const description = `LiveManager ${tier} — ${plan}`;
    const metadata: Record<string, any> = {
      tier,
      plan,
      ...(userId && { userId }),
      ...(telegramId && { telegramId }),
    };

    const receipt = email
      ? {
          customer: { email },
          items: [
            {
              description,
              quantity: '1.00',
              amount: { value: fmt(finalK), currency: 'RUB' },
              vat_code: 1,
              payment_mode: 'full_prepayment',
              payment_subject: 'service',
            },
          ],
        }
      : undefined;

    const payload: any = {
      amount: { value: fmt(finalK), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: `${returnBase}/pay/return` }, // ← явный return_url
      description,
      metadata,
      ...(receipt ? { receipt } : {}),
    };

    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');
    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Idempotence-Key': idempotenceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json(
        { ok: false, error: data?.description || 'YKassa error', details: data },
        { status: 400 }
      );
    }

    const urlToPay = data?.confirmation?.confirmation_url as string | undefined;
    const paymentId = data?.id as string | undefined;
    if (!urlToPay || !paymentId) {
      return NextResponse.json({ ok: false, error: 'NO_CONFIRMATION_URL' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, url: urlToPay, paymentId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
