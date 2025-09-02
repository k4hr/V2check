import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { PRICES } from '../../../../lib/pricing';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // 1) Обработка pre_checkout_query — обязательно ответить ok=true, иначе платёж не завершится
    if (update.pre_checkout_query?.id) {
      const id = update.pre_checkout_query.id as string;
      if (BOT_TOKEN) {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify({ pre_checkout_query_id: id, ok: true })
        }).catch(()=>{});
      }
      return NextResponse.json({ ok: true });
    }

    // 2) Успешная оплата
    const msg = update.message;
    if (msg?.successful_payment) {
      const userId = msg.from?.id as number | undefined;
      const sp = msg.successful_payment;
      const payload = sp.invoice_payload as string | undefined; // "sub:PLAN:timestamp"
      const currency = sp.currency; // "XTR"
      const total = sp.total_amount; // минимальные единицы: stars*100
      if (!userId || !payload) {
        return NextResponse.json({ ok: true });
      }

      const parts = payload.split(':'); // ['sub','PLAN','ts']
      const planKey = (parts[1] || '') as keyof typeof PRICES;
      const planCfg = PRICES[planKey];
      if (!planCfg) {
        return NextResponse.json({ ok: true });
      }

      const now = Date.now();
      const base = new Date(now);
      const prev = await prisma.user.findUnique({
        where: { telegramId: String(userId) },
        select: { expiresAt: true }
      });

      // продлеваем от текущей даты истечения, если есть активная
      let startAt = base.getTime();
      if (prev?.expiresAt && prev.expiresAt.getTime() > now) {
        startAt = prev.expiresAt.getTime();
      }

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
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 200 });
  }
}
