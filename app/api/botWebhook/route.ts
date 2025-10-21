// app/api/botWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN  = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const WH_SECRET  = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '').trim();
const APP_ORIGIN = (process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN || '').replace(/\/+$/,'');

type TgUpdate = {
  update_id?: number;
  pre_checkout_query?: {
    id: string;
    from: { id: number; username?: string };
    invoice_payload: string;
  };
  message?: {
    message_id?: number;
    from?: { id?: number; username?: string };
    chat?: { id?: number; username?: string; type?: string };
    text?: string;
    successful_payment?: {
      invoice_payload: string;
      telegram_payment_charge_id?: string;
      provider_payment_charge_id?: string;
      currency?: string;
      total_amount?: number; // minor units (Stars)
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

// --- простой пинг, чтобы в браузере не был "белый экран"
export async function GET() {
  return NextResponse.json({ ok: true, ping: 'botWebhook alive' });
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    // Проверка секрета только для входящих апдейтов от Telegram
    if (WH_SECRET) {
      const got = (req.headers.get('x-telegram-bot-api-secret-token') || '').trim();
      if (got !== WH_SECRET) {
        return NextResponse.json({ ok: false, error: 'WEBHOOK_FORBIDDEN' }, { status: 403 });
      }
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;

    // --- /start (текстовые апдейты)
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id || update.message?.from?.id;

    if (text && chatId && /^\/start\b/i.test(text)) {
      // Сообщение на английском + кнопка, открывающая Web App прямо в Telegram
      const welcome =
        "Hi! I'm your personal assistant in Telegram.\n\n" +
        "🚀 Inside you’ll find daily tools for plans, health, home, content, ideas, and more.\n\n" +
        "Tap the button below to open the app — let’s go!";

      const reply_markup = APP_ORIGIN
        ? {
            inline_keyboard: [[{ text: 'Open LiveManager ❤️', web_app: { url: APP_ORIGIN } }]],
          }
        : undefined; // если URL не задан — просто пришлём текст

      await tg('sendMessage', {
        chat_id: chatId,
        text: welcome,
        reply_markup,
      });

      return NextResponse.json({ ok: true, stage: 'start_sent' });
    }

    // --- Pre-checkout fast ack
    if (update.pre_checkout_query) {
      const { id } = update.pre_checkout_query;
      await tg('answerPreCheckoutQuery', { pre_checkout_query_id: id, ok: true });
      return NextResponse.json({ ok: true, stage: 'pre_checkout_ok' });
    }

    // --- Успешная оплата (Stars/TON/…)
    const sp = update.message?.successful_payment;

    if (sp && chatId) {
      const parsed = parsePayload(sp.invoice_payload);
      if (!parsed) return NextResponse.json({ ok: false, error: 'BAD_PAYLOAD' }, { status: 400 });

      const { tier, plan } = parsed;
      const username =
        update.message?.from?.username ||
        update.message?.chat?.username ||
        null;

      const telegramId = String(chatId);
      const chargeId = sp.telegram_payment_charge_id || null;
      const providerChargeId = sp.provider_payment_charge_id || null;

      // идемпотентность по telegramChargeId
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

      const now = new Date();
      const from = u.subscriptionUntil && u.subscriptionUntil > now ? u.subscriptionUntil : now;

      const prices = getPrices(tier);
      const days = prices[plan].days;
      const until = addDays(from, days);

      // лог платежа
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

      // продление подписки
      await prisma.user.update({
        where: { id: u.id },
        data: { subscriptionUntil: until, plan: tier },
      });

      try {
        await tg('sendMessage', {
          chat_id: chatId,
          text:
            `✅ Subscription active until ${until.toISOString().slice(0, 10)}.\n` +
            `Tier: ${tier === 'PROPLUS' ? 'Pro+' : 'Pro'} — ${prices[plan].label}. Thank you!`,
        });
      } catch {}

      return NextResponse.json({ ok: true, stage: 'subscription_extended', tier, plan, until });
    }

    return NextResponse.json({ ok: true, noop: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
