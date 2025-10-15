/* path: app/api/pay/ton/create/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';
import { TON_ADDRESS, starsToTon, makeTonDeepLink, payloadFor } from '@/lib/ton';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // читаем tier/plan из body или query
    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);

    const tier: Tier = resolveTier(body?.tier || url.searchParams.get('tier') || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || url.searchParams.get('plan') || 'MONTH');

    // telegram id опционально (для подписи в комментарии перевода)
    const tgId =
      body?.id ||
      url.searchParams.get('id') ||
      undefined;

    // цены в «звёздах», пересчёт в TON
    const price = getPrices(tier)[plan];
    const amountTon = starsToTon(price.stars); // из lib/ton.ts

    if (!TON_ADDRESS) {
      return NextResponse.json({ ok: false, error: 'TON_ADDRESS_MISSING' }, { status: 500 });
    }
    if (!amountTon || amountTon <= 0) {
      return NextResponse.json({ ok: false, error: 'BAD_AMOUNT' }, { status: 400 });
    }

    // текст комментария (payload) — нужен для последующей сверки входящих платежей
    const text = payloadFor(tier, plan, tgId ? String(tgId) : undefined);

    // готовим deeplink
    const deeplink = makeTonDeepLink(TON_ADDRESS, amountTon, text);

    // простая валидация формата
    if (!/^ton:\/\/transfer\/[^?]+/i.test(deeplink)) {
      return NextResponse.json({ ok: false, error: 'DEEPLINK_FORMAT_INVALID' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      payton: deeplink,          // ключ, который читает фронт
      address: TON_ADDRESS,
      amount: amountTon,         // в TON (не nano)
      text,                      // комментарий платежа
      tier, plan,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
