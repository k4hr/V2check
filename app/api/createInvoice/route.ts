import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { PRICES, type Plan } from '../../lib/pricing';

export async function POST(req: NextRequest) {
  try {
    // 1) План: из body или из query (?plan=MONTH)
    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);
    const plan = (body?.plan || url.searchParams.get('plan') || 'MONTH') as Plan;

    const cfg = PRICES[plan as Plan];
    if (!cfg) return NextResponse.json({ ok:false, error: 'Unknown plan' }, { status: 400 });

    // 2) Токен из окружения: TG_BOT_TOKEN ИЛИ BOT_TOKEN
    const token = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';
    if (!token) {
      return NextResponse.json({ ok:false, error: 'Missing TG_BOT_TOKEN or BOT_TOKEN' }, { status: 500 });
    }

    // 3) Запрос к Bot API
    const res = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: cfg.title,
        description: cfg.description,
        payload: `${plan}:${Date.now()}`,
        provider_token: '',          // Stars
        currency: 'XTR',             // Stars currency
        prices: [{ label: cfg.title, amount: cfg.amount }],
        start_parameter: 'start_parameter'
      })
    });

    const data = await res.json().catch(() => null) as any;
    if (!data?.ok || !data?.result) {
      const detail = data?.description || 'Telegram createInvoiceLink failed';
      return NextResponse.json({ ok:false, error: detail, detail: data }, { status: 500 });
    }

    return NextResponse.json({ ok:true, link: data.result });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
