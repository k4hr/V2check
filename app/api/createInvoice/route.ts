// app/api/createInvoice/route.ts — генерация Telegram Stars инвойса
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PRICES, resolvePlan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const PROVIDER_TOKEN = process.env.TG_PROVIDER_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);
    const planKey = resolvePlan((body?.plan || url.searchParams.get('plan') || 'MONTH') as string);
    const price = PRICES[planKey];

    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    // Telegram Stars (XTR). amount — число звёзд
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: price.title,
        description: price.description,
        payload: `subs:${planKey}`,
        currency: 'XTR',
        prices: [{ label: price.label, amount: price.stars }],
        provider_token: PROVIDER_TOKEN || undefined,
        start_parameter: `subs_${planKey.toLowerCase()}`
      })
    });

    const data: any = await res.json().catch(() => null);
    if (!data?.ok || !data?.result) {
      const detail = data?.description || 'Telegram createInvoiceLink failed';
      return NextResponse.json({ ok: false, error: detail, detail: data }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      link: data.result,
      plan: planKey,
      days: price.days,
      amount: price.amount
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
