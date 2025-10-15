/* path: app/api/pay/ton/create/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';
import {
  TON_ADDRESS,
  starsToTon,
  tonToNano,
  makeTonDeepLink,
  payloadFor,
} from '@/lib/ton';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);

    const tier: Tier = resolveTier(body?.tier || url.searchParams.get('tier') || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || url.searchParams.get('plan') || 'MONTH');
    const tgId = body?.id || url.searchParams.get('id') || undefined;

    const price = getPrices(tier)[plan];
    const amountTon = starsToTon(price.stars);
    if (!TON_ADDRESS) return NextResponse.json({ ok:false, error:'TON_ADDRESS_MISSING' }, { status:500 });
    if (!amountTon || amountTon <= 0) return NextResponse.json({ ok:false, error:'BAD_AMOUNT' }, { status:400 });

    // комментарий к платежу — нужен для сверки входящих транзакций
    const text = payloadFor(tier, plan, tgId ? String(tgId) : undefined);

    // основной deeplink (схема ton://) и универсальная https-ссылка (Tonkeeper)
    const payton = makeTonDeepLink(TON_ADDRESS, amountTon, text);
    const amountNano = tonToNano(amountTon).toString();
    const universal =
      `https://app.tonkeeper.com/transfer/${encodeURIComponent(TON_ADDRESS)}?amount=${encodeURIComponent(amountNano)}&text=${encodeURIComponent(text)}`;

    return NextResponse.json({
      ok: true,
      payton,           // ton://transfer/…
      universal,        // https://app.tonkeeper.com/transfer/…
      address: TON_ADDRESS,
      amountTon,
      amountNano,
      text,
      tier, plan,
    });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}
