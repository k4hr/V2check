// app/api/botWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- токены и конфигурация ---
const BOT_TOKEN  = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const WH_SECRET  = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'supersecret12345').trim();
const APP_ORIGIN = (process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN || '').replace(/\/+$/, '');
// важно: имя бота для deeplink
const BOT_USERNAME = process.env.BOT_USERNAME || 'LiveManagBot';
// стартовый параметр mini-app (чтобы отличать экраны на старте)
const STARTAPP_PARAM = 'home';

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
      total_amount?: number;
    };
  };
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

// --- health-check
export async function GET() {
  return NextResponse.json({ ok: true, ping: 'botWebhook alive' });
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    // Проверяем секрет от Telegram
    const got = (req.headers.get('x-telegram-bot-api-secret-token') || '').trim();
    if (WH_SECRET && got !== WH_SECRET) {
      console.warn('[botWebhook] Forbidden: bad secret', { got });
      return NextResponse.json({ ok: false, error: 'WEBHOOK_FORBIDDEN' }, { status: 403 });
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;
    const text = update.message?.text?.trim();
    const chatId = update.message?.chat?.id || update.message?.from?.id;

    // --- /support ---
    if (text && chatId && /^\/support\b/i.test(text)) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: 'При возникновении каких либо проблем — обращайтесь @seimngr',
      });
      return NextResponse.json({ ok: true, stage: 'support_sent' });
    }

    // --- /start ---
    if (text && chatId && /^\/start\b/i.test(text)) {
      const welcome =
        'Привет! Я твой персональный ассистент в Telegram.\n\n' +
        '🚀 Внутри — набор ежедневных инструментов: планы, здоровье, дом, контент, идеи и многое другое.\n\n' +
        'Нажми кнопку ниже, чтобы открыть приложение.';

      // deeplink в Main App (fullscreen согласно настройке BotFather)
      const deeplink = `https://t.me/${BOT_USERNAME}/app?startapp=${encodeURIComponent(STARTAPP_PARAM)}`;

      // кнопка web_app как fallback (и для быстрого входа из чата)
      // передаём tgWebAppStartParam, чтобы вы видели start_param на стороне клиента
      const webAppUrl = APP_ORIGIN
        ? `${APP_ORIGIN}/home?tgWebAppStartParam=${encodeURIComponent(STARTAPP_PARAM)}`
        : '';

      const reply_markup =
        APP_ORIGIN
          ? {
              inline_keyboard: [
                [{ text: 'Открыть в полноэкранном режиме', url: deeplink }],
                [{ text: 'Открыть здесь (в чате)', web_app: { url: webAppUrl } }],
              ],
            }
          : {
              inline_keyboard: [[{ text: 'Открыть в полноэкранном режиме', url: deeplink }]],
            };

      await tg('sendMessage', {
        chat_id: chatId,
        text: welcome,
        disable_web_page_preview: true,
        reply_markup,
      });
      return NextResponse.json({ ok: true, stage: 'start_sent' });
    }

    // --- Pre-checkout fast ack ---
    if (update.pre_checkout_query) {
      const { id } = update.pre_checkout_query;
      await tg('answerPreCheckoutQuery', { pre_checkout_query_id: id, ok: true });
      return NextResponse.json({ ok: true, stage: 'pre_checkout_ok' });
    }

    // --- Успешная оплата / продление подписки ---
    const sp = update.message?.successful_payment;
    if (sp && chatId) {
      const parsed = parsePayload(sp.invoice_payload);
      if (!parsed) return NextResponse.json({ ok: false, error: 'BAD_PAYLOAD' }, { status: 400 });

      const { tier, plan } = parsed;
      const username = update.message?.from?.username || update.message?.chat?.username || null;

      const telegramId = String(chatId);
      const chargeId = sp.telegram_payment_charge_id || null;
      const providerChargeId = sp.provider_payment_charge_id || null;

      // идемпотентность
      if (chargeId) {
        const exists = await prisma.payment.findFirst({
          where: { telegramId, telegramChargeId: chargeId },
          select: { id: true },
        });
        if (exists) return NextResponse.json({ ok: true, stage: 'already_processed' });
      }

      // upsert пользователя
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

      await tg('sendMessage', {
        chat_id: chatId,
        text:
          `✅ Подписка активна до ${until.toISOString().slice(0, 10)}.\n` +
          `Тариф: ${tier === 'PROPLUS' ? 'Pro+' : 'Pro'} — ${prices[plan].label}. Спасибо!`,
      });

      return NextResponse.json({ ok: true, stage: 'subscription_extended', tier, plan, until });
    }

    return NextResponse.json({ ok: true, noop: true });
  } catch (e: any) {
    console.error('[botWebhook] Error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
