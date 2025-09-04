import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '../../../lib/prisma';
import { PRICES } from '../../../lib/pricing';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

function daysToMs(days: number) { return days * 24 * 60 * 60 * 1000; }

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    console.log('[botWebhook] update kind:', Object.keys(update || {}));

    // 1) pre_checkout_query — подтверждаем
    if (update?.pre_checkout_query?.id) {
      const id = String(update.pre_checkout_query.id);
      if (BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: true, pre_checkout_query_id: id }),
        }).catch(() => {});
      }
      return NextResponse.json({ ok: true });
    }

    // 2) успешный платеж
    const msg = update?.message;
    if (msg?.successful_payment) {
      const userId = msg?.from?.id ? String(msg.from.id) : null;
      const payload: string | null = msg?.successful_payment?.invoice_payload || null;
      console.log('[botWebhook] successful_payment:', { userId, payload });

      if (!userId || !payload) return NextResponse.json({ ok: true });

      const rawKey = payload.includes(':') ? payload.split(':')[1] : payload;
      const planKey = String(rawKey || '').toUpperCase() as keyof typeof PRICES;
      const planCfg = PRICES[planKey];
      if (!planCfg) {
        console.warn('[botWebhook] unknown planKey:', planKey);
        return NextResponse.json({ ok: true });
      }

      const now = Date.now();
      // В твоей схеме у пользователя поля называются subscriptionUntil и subscription
      const prev = await prisma.user.findUnique({
        where: { telegramId: userId },
        select: { subscriptionUntil: true },
      });

      let base = now;
      if (prev?.subscriptionUntil) {
        const prevMs = new Date(prev.subscriptionUntil as any).getTime();
        if (!Number.isNaN(prevMs) && prevMs > now) base = prevMs; // продлеваем «от конца»
      }
      const expiresAt = new Date(base + daysToMs(planCfg.days));

      // Записываем в те поля, что есть в схеме: subscription / subscriptionUntil
      await prisma.user.upsert({
        where: { telegramId: userId },
        create: { telegramId: userId, subscription: planCfg.label, subscriptionUntil: expiresAt },
        update: { subscription: planCfg.label, subscriptionUntil: expiresAt },
      });

      console.log('[botWebhook] updated subscription:', { userId, plan: planCfg.label, subscriptionUntil: expiresAt });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('botWebhook error', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 200 });
  }
}
