/* path: app/api/pay/cryptopay/createInvoice/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ⚠️ Теперь без CryptoPay.
 * Этот endpoint генерирует deep-link для прямого перевода на TON-кошелёк
 * с предзаполненной суммой и комментарием (для сопоставления платежа).
 */

// ENV / настройки
const TON_ADDRESS = (process.env.TON_WALLET_ADDRESS || 'UQD3cPQVrdaPdHE0Ez6b6Z8e3eLw8Pu8YPu1AKAlRdYq7dIs').trim();
// Во что конвертируем “звёзды”: amountTON = stars * MULTIPLIER  (пример: 0.01 → 399⭐ = 3.99 TON)
const MULTIPLIER = Number(process.env.TON_AMOUNT_PER_STAR || '0.01');

function toFixedAmountTON(n: number) {
  // для TON обычно достаточно 2-х знаков после запятой (кошельки округлят точнее при необходимости)
  return n.toFixed(2);
}
function toNano(ton: string) {
  // amount (nanotons) — целое число
  const n = Math.round(Number(ton) * 1e9);
  return n.toString();
}

function buildTonUri(address: string, amountTON: string, text: string) {
  const amountNano = toNano(amountTON);
  const query = new URLSearchParams({ amount: amountNano, text }).toString();
  return `ton://transfer/${address}?${query}`;
}
function buildTonkeeper(address: string, amountTON: string, text: string) {
  const query = new URLSearchParams({ amount: amountTON, text }).toString();
  return `https://app.tonkeeper.com/transfer/${address}?${query}`;
}
function buildTonhub(address: string, amountTON: string, text: string) {
  const query = new URLSearchParams({ amount: amountTON, text }).toString();
  return `https://tonhub.com/transfer/${address}?${query}`;
}

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);

    // тариф и период
    const tier: Tier = resolveTier(body?.tier || url.searchParams.get('tier') || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || url.searchParams.get('plan') || 'MONTH');
    const price     = getPrices(tier)[plan];

    // сумма в TON
    const amountTON = toFixedAmountTON(price.stars * MULTIPLIER);

    // payload/комментарий для сопоставления платежа
    const orderId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
    const payload = `subs2:${tier}:${plan}:${orderId}`;
    const comment = `${price.title} • ${payload}`;

    // deep links
    const tonUri      = buildTonUri(TON_ADDRESS, amountTON, comment);
    const tonkeeper   = buildTonkeeper(TON_ADDRESS, amountTON, comment);
    const tonhub      = buildTonhub(TON_ADDRESS, amountTON, comment);

    return NextResponse.json({
      ok: true,
      asset: 'TON',
      address: TON_ADDRESS,
      amountTon: amountTON,
      amountNanoTon: toNano(amountTON),
      comment,
      orderId,
      tier, plan,
      links: {
        ton: tonUri,          // системный ton://transfer/… (многие кошельки подхватят)
        tonkeeper,            // web+app deeplink для Tonkeeper
        tonhub,               // web deeplink для Tonhub
      },
      // можно отрисовать QR на основе `ton` или просто адреса
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
