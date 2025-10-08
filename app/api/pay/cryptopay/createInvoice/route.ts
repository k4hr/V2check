// app/api/pay/cryptopay/createInvoice/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRYPTO_PAY_TOKEN      = (process.env.CRYPTO_PAY_TOKEN || '').trim(); // токен мерчанта из @CryptoBot
const CRYPTO_DEFAULT_ASSET  = (process.env.CRYPTO_DEFAULT_ASSET || 'TON').trim().toUpperCase(); // 'TON' | 'USDT' ...
const USD_PER_STAR          = Number(process.env.USD_PER_STAR || 0.01); // сколько USD считаем за 1 Star
const TON_USD_RATE          = Number(process.env.TON_USD_RATE || 5);    // курс TON->USD (руками/кроной обновляем)

type CreateInvoiceResp = {
  ok: boolean;
  result?: {
    invoice_id: string;
    status: string;
    pay_url: string;
    bot_invoice_url?: string;
  };
  description?: string;
};

function starsToAssetAmount(stars: number, asset: string): string {
  const usd = stars * USD_PER_STAR;
  if (asset === 'USDT') return usd.toFixed(2);
  if (asset === 'TON')  return (usd / (TON_USD_RATE || 5)).toFixed(4);
  // по умолчанию считаем как USD-токен
  return usd.toFixed(2);
}

export async function POST(req: NextRequest) {
  try {
    if (!CRYPTO_PAY_TOKEN) {
      return NextResponse.json({ ok: false, error: 'CRYPTO_PAY_TOKEN_MISSING' }, { status: 500 });
    }

    let body: any = null;
    try { body = await req.json(); } catch {}

    const url = new URL(req.url);

    // совместимость: и body, и query
    const tier: Tier = resolveTier(body?.tier || url.searchParams.get('tier') || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || url.searchParams.get('plan') || 'MONTH');

    // пробросим telegramId (как и в других эндпоинтах) через ?id=
    const tgId = (body?.id || url.searchParams.get('id') || '').trim();

    // выставляем цены
    const price = getPrices(tier)[plan];
    const asset = String((body?.asset || url.searchParams.get('asset') || CRYPTO_DEFAULT_ASSET)).toUpperCase();
    const amount = starsToAssetAmount(price.stars, asset);

    // payload: чтобы в вебхуке понять тариф/план и пользователя
    // формат: cpay:subs2:TIER:PLAN[:TGID]
    const payload = `cpay:subs2:${tier}:${plan}${tgId ? `:${tgId}` : ''}`;

    const res = await fetch('https://pay.crypt.bot/api/createInvoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Crypto-Pay-API-Token': CRYPTO_PAY_TOKEN,
      },
      body: JSON.stringify({
        asset,               // 'TON' | 'USDT' ...
        amount,              // строка, 2..8 знаков после запятой
        description: price.title,
        payload,             // вернётся в вебхук как есть
        allow_anonymous: true,
        expires_in: 3600 * 24, // сутки
      }),
    });

    const data = (await res.json().catch(() => ({}))) as CreateInvoiceResp;
    if (!data?.ok || !data?.result?.pay_url) {
      const detail = data?.description || 'Crypto Pay createInvoice failed';
      return NextResponse.json({ ok: false, error: detail, detail: data }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      pay_url: data.result.pay_url,
      invoice_id: data.result.invoice_id,
      asset,
      tier,
      plan,
      stars: price.stars,
      amount_asset: amount,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
