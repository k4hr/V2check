import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PRICES, type Plan } from '../../../lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const PROVIDER_TOKEN = process.env.TG_PROVIDER_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);
    const plan = (body?.plan || url.searchParams.get('plan') || 'MONTH') as Plan;

    const price = PRICES[plan];
    if (!price) return NextResponse.json({ ok:false, error:'Unknown plan' }, { status:400 });

    const payload = `subs:${plan}`; // то, что вебхук парсит потом
    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Juristum Pro — ${price.label}`,
        description: `Подписка на ${price.label} (${price.days} дней)`,
        payload,
        currency: 'XTR',
        prices: [{ label: price.label, amount: price.stars }],
        provider_token: PROVIDER_TOKEN || undefined,
        start_parameter: `subs_${plan.toLowerCase()}`,
      }),
    });

    const data: any = await res.json().catch(() => null);
    if (!data?.ok || !data?.result) {
      const detail = data?.description || 'Telegram createInvoiceLink failed';
      return NextResponse.json({ ok:false, error: detail, detail: data }, { status: 500 });
    }

    return NextResponse.json({ ok:true, link: data.result });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
