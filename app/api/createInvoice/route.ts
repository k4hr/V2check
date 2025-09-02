import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PRICES, type Plan } from '../../lib/pricing';

// Для Stars нужен BOT_TOKEN из .env
const BOT_TOKEN = process.env.BOT_TOKEN;
const XTR_FACTOR = 100; // Stars: amount указывается в минимальных единицах

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok:false, error:'BOT_TOKEN is not set' }, { status:500 });
    }

    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);
    const plan = (body?.plan || url.searchParams.get('plan') || 'MONTH') as Plan;

    if (!(plan in PRICES)) {
      return NextResponse.json({ ok:false, error:`Unknown plan: ${plan}` }, { status:400 });
    }

    const price = PRICES[plan];
    const title = `Подписка — ${price.label}`;
    const description = `${price.days} дней доступа`;
    const payload = `sub:${plan}:${Date.now()}`;

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        payload,
        currency: 'XTR',
        prices: [
          {
            label: price.label,
            amount: price.stars * XTR_FACTOR
          }
        ],
        start_parameter: `subs_${plan.toLowerCase()}`
      })
    });

    const data = await res.json().catch(() => null) as any;
    if (!res.ok || !data?.ok || !data?.result) {
      return NextResponse.json({ ok:false, error:data?.description || 'Telegram error', detail:data }, { status:500 });
    }

    return NextResponse.json({ ok:true, link:data.result, payload });
  } catch(e:any) {
    return NextResponse.json({ ok:false, error:e?.message || 'Server error' }, { status:500 });
  }
}
