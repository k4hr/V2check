// app/api/createInvoice/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPrices, resolvePlan, resolveTier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const PROVIDER_TOKEN = process.env.TG_PROVIDER_TOKEN || ''; // для совместимости; для Stars не обязателен

export async function POST(req: NextRequest) {
  try {
    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);

    const planKey = resolvePlan((body?.plan || url.searchParams.get('plan') || 'MONTH') as string);
    const tier = resolveTier((body?.tier || url.searchParams.get('tier') || 'pro') as string);
    const PRICES = getPrices(tier);
    const price = PRICES[planKey];

    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;
    const payload = `subs:${tier}:${planKey}`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: price.title,
        description: price.description,
        payload,
        currency: 'XTR', // Stars
        prices: [{ label: `${price.label} (${tier})`, amount: price.stars }],
        provider_token: PROVIDER_TOKEN || undefined,
        start_parameter: `subs_${tier}_${planKey.toLowerCase()}`,
      }),
    });

    const data: any = await res.json().catch(() => null);
    if (!data?.ok || !data?.result) {
      const detail = data?.description || 'Telegram createInvoiceLink failed';
      return NextResponse.json({ ok: false, error: detail, detail: data }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      link: data.result,
      tier,
      plan: planKey,
      days: price.days,
      amount: price.amount,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
