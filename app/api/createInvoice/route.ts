// app/api/createInvoice/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PRICES, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const PROVIDER_TOKEN = process.env.TG_PROVIDER_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    // читаем JSON если он есть, но не падаем
    let body: any = null;
    try { body = await req.json(); } catch {}

    const url = new URL(req.url);
    const planParam = (body?.plan || url.searchParams.get('plan') || 'MONTH') as string;
    const plan = planParam.toUpperCase() as Plan;

    const price = PRICES[plan];
    if (!price) {
      return NextResponse.json({ ok: false, error: 'BAD_PLAN' }, { status: 400 });
    }
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    const payload = `subs:${plan}`; // вебхук потом распарсит это значение
    const apiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

    // ВАЖНО: для Stars ('XTR') amount — это число единиц в минимальных единицах.
    // В твоей схеме мы храним уже правильное целое в price.amount.
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Juristum Pro — ${price.label}`,
        description: `Подписка на ${price.label} (${price.days} дней)`,
        payload,
        currency: 'XTR',
        prices: [{ label: price.label, amount: price.amount }],
        provider_token: PROVIDER_TOKEN || undefined, // для Stars обычно не обязателен
        start_parameter: `subs_${plan.toLowerCase()}`,
      }),
    });

    const data: any = await res.json().catch(() => null);
    if (!data?.ok || !data?.result) {
      const detail = data?.description || 'Telegram createInvoiceLink failed';
      return NextResponse.json({ ok: false, error: detail, detail: data }, { status: 502 });
    }

    return NextResponse.json({ ok: true, link: data.result, plan, amount: price.amount });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
