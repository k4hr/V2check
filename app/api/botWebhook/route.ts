// app/api/botWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PRICES, resolvePlan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const WH_SECRET = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '').trim();

type TgUpdate = {
  update_id?: number;
  pre_checkout_query?: {
    id: string;
    from: { id: number };
    invoice_payload: string;
  };
  message?: {
    message_id?: number;
    from?: { id?: number };
    chat?: { id?: number };
    successful_payment?: {
      invoice_payload: string;
      telegram_payment_charge_id?: string;
      provider_payment_charge_id?: string;
      currency?: string;
      total_amount?: number;
    }
  }
};

async function tg(method: string, payload: any) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function planFromPayload(payload: string): keyof typeof PRICES | null {
  const m = /^subs:(.+)$/i.exec(String(payload || ''));
  if (!m) return null;
  const key = resolvePlan(m[1]);
  return key;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });

    if (WH_SECRET) {
      const got = (req.headers.get('x-telegram-bot-api-secret-token') || '').trim();
      if (got !== WH_SECRET) return NextResponse.json({ ok:false, error:'WEBHOOK_FORBIDDEN' }, { status:403 });
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;

    if (update.pre_checkout_query) {
      const { id } = update.pre_checkout_query;
      await tg('answerPreCheckoutQuery', { pre_checkout_query_id: id, ok: true });
      return NextResponse.json({ ok: true, stage: 'pre_checkout_ok' });
    }

    const sp = update.message?.successful_payment;
    const chatId = update.message?.chat?.id || update.message?.from?.id;
    if (sp && chatId) {
      const plan = planFromPayload(sp.invoice_payload);
      if (!plan) return NextResponse.json({ ok: false, error: 'BAD_PAYLOAD' }, { status: 400 });

      const u = await prisma.user.upsert({
        where: { telegramId: String(chatId) },
        create: { telegramId: String(chatId) },
        update: {},
      });

      const now = new Date();
      const from = u.subscriptionUntil && u.subscriptionUntil > now ? u.subscriptionUntil : now;
      const until = addDays(from, PRICES[plan].days);

      await prisma.user.update({
        where: { id: u.id },
        data: { subscriptionUntil: until, updatedAt: new Date() },
      });

      try {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `✅ Подписка активна до ${until.toISOString().slice(0,10)}. Спасибо за покупку!`,
        });
      } catch {}

      return NextResponse.json({ ok: true, stage: 'subscription_extended', plan, until });
    }

    return NextResponse.json({ ok: true, noop: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
