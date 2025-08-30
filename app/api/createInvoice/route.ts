import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { PRICES } from '../../lib/pricing';
import type { Plan } from '../../lib/pricing';

/**
 * POST /api/createInvoice
 * Body: { plan: 'WEEK' | 'MONTH' | 'HALF' | 'YEAR' }
 * Returns: { ok: true, link: string } or { ok:false, error: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as { plan?: Plan } | null;
    const url = new URL(req.url);
    const plan = (body?.plan || (url.searchParams.get('plan') as Plan) || 'MONTH') as Plan;

    const cfg = PRICES[plan];
    if (!cfg) {
      return NextResponse.json({ ok:false, error: 'Unknown plan' }, { status: 400 });
    }

    const payload = `${plan}:${Date.now()}`;

    const token = process.env.TG_BOT_TOKEN || '';
    if (!token) {
      return NextResponse.json({ ok:false, error: 'Missing TG_BOT_TOKEN' }, { status: 500 });
    }

    const res = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        title: cfg.title,
        description: cfg.description,
        payload,
        provider_token: '',        // Stars
        currency: 'XTR',           // Stars currency
        prices: [{ label: cfg.title, amount: cfg.amount }],
        start_parameter: 'start_parameter'
      })
    });

    const data = await res.json();
    if (!data?.ok || !data?.result) {
      return NextResponse.json({ ok:false, error: 'Telegram createInvoiceLink failed', detail: data }, { status: 500 });
    }

    return NextResponse.json({ ok:true, link: data.result });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
