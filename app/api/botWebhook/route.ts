import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { PRICES } from '../../../lib/pricing';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // 1) pre_checkout_query: подтверждаем платеж
    if (update.pre_checkout_query?.id) {
      const id = update.pre_checkout_query.id as string;
      if (BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pre_checkout_query_id: id, ok: true })
        }).catch(()=>{});
      }
      return NextResponse.json({ ok: true });
    }

    // 2) successful_payment: зачисляем подписку
    const msg = update.message;
    if (msg?.successful_payment) {
      const userId = msg.from?.id as number | undefined;
      const sp = msg.successful_payment;
      const payload = sp.invoice_payload as string | undefined; // "sub:PLAN:ts"
      if (!userId || !payload) return NextResponse.json({ ok: true });

      const planKey = (payload.split(':')[1] || '') as keyof typeof PRICES;
      const planCfg = PRICES[planKey];
      if (!planCfg) return NextResponse.json({ ok: true });

      const now = Date.now();
      const prev = await prisma.user.findUnique({
        where: { telegramId: String(userId) },
        select: { expiresAt: true }
      });

      const startAt = prev?.expiresAt && prev.expiresAt.getTime() > now
        ? prev.expiresAt.getTime()
        : now;

      const newExpires = new Date(startAt + planCfg.days * 24 * 60 * 60 * 1000);

      await prisma.user.upsert({
        where: { telegramId: String(userId) },
        update: { plan: planCfg.label, expiresAt: newExpires },
        create: {
          telegramId: String(userId),
          username: msg.from?.username || null,
          firstName: msg.from?.first_name || null,
          lastName: msg.from?.last_name || null,
          photoUrl: null,
          plan: planCfg.label,
          expiresAt: newExpires
        }
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    console.error('botWebhook error', e);
    // Возвращаем 200, чтобы Telegram не долбил ретраями
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 200 });
  }
}
