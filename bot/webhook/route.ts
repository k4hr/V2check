// bot/webhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN  = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const WH_SECRET  = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '').trim();
const APP_ORIGIN = (process.env.APP_ORIGIN || '').replace(/\/+$/, ''); // без хвоста /

type TgUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    from?: { id?: number; username?: string; first_name?: string };
    chat?: { id?: number; type?: 'private'|'group'|'supergroup'|'channel'; username?: string };
    text?: string;
    successful_payment?: {
      invoice_payload: string;
      telegram_payment_charge_id?: string;
      provider_payment_charge_id?: string;
      currency?: string;
      total_amount?: number;
    }
  };
  pre_checkout_query?: {
    id: string;
    from: { id: number; username?: string };
    invoice_payload: string;
  };
};

async function tg(method: string, payload: any) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // Telegram сам ретраит, 200 достаточно
  });
  return res.json().catch(() => ({}));
}

// subs2:TIER:PLAN  |  subs:PLAN (legacy → PRO)
function parsePayload(raw: string): { tier: Tier; plan: Plan } | null {
  const m2 = /^subs2:([A-Za-z_]+):([A-Za-z_]+)$/i.exec(String(raw || ''));
  if (m2) return { tier: resolveTier(m2[1]), plan: resolvePlan(m2[2]) };
  const m1 = /^subs:([A-Za-z_]+)$/i.exec(String(raw || ''));
  if (m1) return { tier: 'PRO', plan: resolvePlan(m1[1]) };
  return null;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    if (WH_SECRET) {
      const got = (req.headers.get('x-telegram-bot-api-secret-token') || '').trim();
      if (got !== WH_SECRET) {
        return NextResponse.json({ ok: false, error: 'WEBHOOK_FORBIDDEN' }, { status: 403 });
      }
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;
    const msg    = update.message;
    const chatId = msg?.chat?.id || msg?.from?.id;

    // ---------- /start ----------
    if (msg?.text && chatId) {
      const isStart = /^\/start\b/i.test(msg.text);
      if (isStart) {
        const text =
`✨ LiveManager — your daily assistant in Telegram.
Helps with tasks, plans, and ideas — all in one place.

Always here to make your life easier 💙`;

        // web_app кнопка — открывает твоё приложение ВНУТРИ Telegram
        const inline_keyboard = [[
          APP_ORIGIN
            ? { text: 'Open LiveManager', web_app: { url: `${APP_ORIGIN}/` } }
            // запасной вариант, если APP_ORIGIN не задан
            : { text: 'Open', callback_data: 'noop' }
        ]];

        await tg('sendMessage', {
          chat_id: chatId,
          text,
          reply_markup: { inline_keyboard }
        });

        return NextResponse.json({ ok: true, stage: 'start_sent' });
      }
    }

    // ---------- Pre-checkout fast ack ----------
    if (update.pre_checkout_query) {
      const { id } = update.pre_checkout_query;
      await tg('answerPreCheckoutQuery', { pre_checkout_query_id: id, ok: true });
      return NextResponse.json({ ok: true, stage: 'pre_checkout_ok' });
    }

    // ---------- Successful payment ----------
    const sp = msg?.successful_payment;
    if (sp && chatId) {
      const parsed = parsePayload(sp.invoice_payload);
      if (!parsed) return NextResponse.json({ ok: false, error: 'BAD_PAYLOAD' }, { status: 400 });

      const { tier, plan } = parsed;
      const username =
        msg?.from?.username ||
        msg?.chat?.username ||
        null;

      const telegramId = String(chatId);
      const chargeId   = sp.telegram_payment_charge_id || null;
      const providerChargeId = sp.provider_payment_charge_id || null;

      // идемпотентность
      if (chargeId) {
        const exists = await prisma.payment.findFirst({
          where: { telegramId, telegramChargeId: chargeId },
          select: { id: true },
        });
        if (exists) return NextResponse.json({ ok: true, stage: 'already_processed' });
      }

      // upsert user
      const u = await prisma.user.upsert({
        where: { telegramId },
        create: { telegramId, username: username || undefined, plan: tier },
        update: { username: username || undefined, plan: tier },
        select: { id: true, subscriptionUntil: true },
      });

      const now  = new Date();
      const from = u.subscriptionUntil && u.subscriptionUntil > now ? u.subscriptionUntil : now;

      const prices = getPrices(tier);
      const days   = prices[plan].days;
      const until  = addDays(from, days);

      await prisma.payment.create({
        data: {
          userId: u.id,
          telegramId,
          payload: sp.invoice_payload,
          tier,
          plan,
          amount: sp.total_amount ?? prices[plan].stars,
          currency: sp.currency || 'XTR',
          days,
          telegramChargeId: chargeId || undefined,
          providerPaymentChargeId: providerChargeId || undefined,
        },
      });

      await prisma.user.update({
        where: { id: u.id },
        data: { subscriptionUntil: until, plan: tier },
      });

      try {
        await tg('sendMessage', {
          chat_id: chatId,
          text:
            `✅ Subscription active until ${until.toISOString().slice(0, 10)}.\n` +
            `Plan: ${tier === 'PROPLUS' ? 'Pro+' : 'Pro'} — ${prices[plan].label}. Thank you!`,
        });
      } catch {}

      return NextResponse.json({ ok: true, stage: 'subscription_extended', tier, plan, until });
    }

    // прочие апдейты игнорим
    return NextResponse.json({ ok: true, noop: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// (по запросу BotFather health-check удобно иметь)
export async function GET() {
  return NextResponse.json({ ok: true });
}
