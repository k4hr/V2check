import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
import { PRICES } from '../../lib/pricing';

import type { Plan } from '../../lib/pricing';


export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const plan = (url.searchParams.get('plan') || 'MONTH') as Plan;
    const cfg = PRICES[plan];
    if (!cfg) return NextResponse.json({ ok:false, error: 'Unknown plan' }, { status:400 });

    const BOT_TOKEN_RAW = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '';
    const BOT_TOKEN = BOT_TOKEN_RAW.trim();
    if (!BOT_TOKEN) return NextResponse.json({ ok:false, error:'BOT_TOKEN is not set on server' }, { status:500 });

    const payload = `plan:${plan}`;

    const tg = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: cfg.title,
        description: cfg.description,
        payload,
        provider_token: '',      // Stars
        currency: 'XTR',         // Stars currency
        prices: [{ label: cfg.title, amount: cfg.amount }],
        start_parameter: 'start_parameter' // повышает совместимость клиентов
      })
    });

    const data = await tg.json();
    if (!data?.ok || !data?.result) {
      return NextResponse.json({ ok:false, error: data?.description || 'Telegram createInvoiceLink failed', detail: data }, { status: 500 });
    }

    return NextResponse.json({ ok:true, link: data.result });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Server error' }, { status: 500 });
  }
}