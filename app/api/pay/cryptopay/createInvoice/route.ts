// app/api/pay/cryptopay/createInvoice/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ENV
const CP_TOKEN   = process.env.CRYPTO_PAY_TOKEN || '';                  // из @CryptoBot → Crypto Pay → Create App
const CP_API     = process.env.CRYPTO_PAY_API_BASE || 'https://pay.crypt.bot/api';
const CP_ASSET   = (process.env.CRYPTO_PAY_ASSET || 'TON').toUpperCase(); // TON | USDT | USDC | BTC | ETH
// во что конвертируем “звёзды”: amount = stars * MULTIPLIER (пример: 0.01 → 399⭐ = 3.99 TON)
const MULTIPLIER = Number(process.env.CRYPTO_PAY_AMOUNT_PER_STAR || '0.01');

function toFixedAmount(n: number) {
  // TON/USDT спокойно принимают 2 знака; ограничим до 2-х.
  return n.toFixed(2);
}

export async function POST(req: NextRequest) {
  try {
    if (!CP_TOKEN) {
      return NextResponse.json({ ok: false, error: 'CRYPTO_PAY_TOKEN_MISSING' }, { status: 500 });
    }

    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);

    const tier: Tier  = resolveTier(body?.tier || url.searchParams.get('tier') || 'PRO');
    const plan: Plan  = resolvePlan(body?.plan || url.searchParams.get('plan') || 'MONTH');
    const price       = getPrices(tier)[plan];

    // Конвертация “звёзд” → крипто-сумма по вашему правилу
    const amountStr = toFixedAmount(price.stars * MULTIPLIER);
    const payload   = `subs2:${tier}:${plan}`;

    const res = await fetch(`${CP_API}/createInvoice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Crypto-Pay-API-Token': CP_TOKEN,     // <-- правильный заголовок
      },
      body: JSON.stringify({
        asset: CP_ASSET,                      // TON/USDT/…
        amount: amountStr,                    // строкой, например "3.99"
        description: price.title,
        payload,                              // вернётся в webhook
        allow_anonymous: true,
        allow_comments: false,
        // paid_btn_name: 'callback',         // опционально
        // paid_btn_url:  'https://…',        // опционально
      }),
    });

    const data: any = await res.json().catch(() => null);

    if (!data?.ok || !data?.result?.pay_url) {
      const detail = data?.error || data?.description || `HTTP_${res.status}`;
      return NextResponse.json(
        { ok: false, error: `cryptopay:createInvoice failed`, detail, request: { asset: CP_ASSET, amount: amountStr, tier, plan } },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      link: data.result.pay_url,             // это то, что надо открывать
      invoice_id: data.result.invoice_id,
      tier, plan,
      asset: CP_ASSET,
      amount: amountStr,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
