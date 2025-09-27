// app/api/createInvoice/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPrices, resolvePlan, resolveTier, type Tier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const PROVIDER_TOKEN = process.env.TG_PROVIDER_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    let body: any = null;
    try { body = await req.json(); } catch {}
    const url = new URL(req.url);

    // Совместимость: можно передать и в body, и через query
    const tier: Tier = resolveTier(body?.tier || url.searchParams.get('tier') || 'PRO');
    const plan      = resolvePlan(body?.plan || url.searchParams.get('plan') || 'MONTH');

    const prices = getPrices(tier);
    const price = prices[plan];

    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

    // Новый payload (tier+plan). Оставляем старый формат в бэкенде для обратной совместимости.
    const payload = `subs2:${tier}:${plan}`;

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:       price.title,
        description: price.description,
        payload,
        currency: 'XTR',
        prices: [{ label: price.label, amount: price.stars }],
        provider_token: PROVIDER_TOKEN || undefined,
        start_parameter: `subs_${tier.toLowerCase()}_${plan.toLowerCase()}`,
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
      plan,
      amount: price.amount,
      days: price.days,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
