// app/api/botWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// --- токены и конфигурация ---
const BOT_TOKEN    = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const WH_SECRET    = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || 'supersecret12345').trim();
const APP_ORIGIN   = (process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_APP_ORIGIN || '').replace(/\/+$/, '');
const BOT_USERNAME = (process.env.BOT_USERNAME || 'LiveManagBot').replace(/^@/, ''); // без @
const STARTAPP_PARAM = 'home';
const GAME_STARTAPP_PARAM = 'game';

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
    chat?: { id?: number; username?: string; type?: 'private'|'group'|'supergroup'|'channel' };
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

    // Секрет вебхука
    const got = (req.headers.get('x-telegram-bot-api-secret-token') || '').trim();
    if (WH_SECRET && got !== WH_SECRET) {
      console.warn('[botWebhook] Forbidden: bad secret', { got });
      return NextResponse.json({ ok: false, error: 'WEBHOOK_FORBIDDEN' }, { status: 403 });
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;
    const text   = update.message?.text?.trim();
    const chatId = update.message?.chat?.id || update.message?.from?.id;

    // --- /support ---
    if (text && chatId && /^\/support\b/i.test(text)) {
      await tg('sendMessage', { chat_id: chatId, text: 'При проблемах — @seimngr' });
      return NextResponse.json({ ok: true, stage: 'support_sent' });
    }

    // --- /10gpt --- розыгрыш
    if (text && chatId && /^\/10gpt\b/i.test(text)) {
      const msg =
        '🎁 *Розыгрыш подписок CHATGPT 5*\n\n' +
        'Разыгрываем *80 призов* среди пользователей приложения:\n' +
        '• 10 годовых, 20 полугодовых и 50 месячных подписок.\n\n' +
        '*Сроки.* До *01.01.2026* (включительно). Покупки в этот период участвуют автоматически.\n\n' +
        '*Как участвовать*\n' +
        '1) Оформите любую платную подписку в приложении.\n' +
        '2) После успешной оплаты вы автоматически попадаете в таблицу участников.\n' +
        '3) Каждая покупка даёт несколько записей — больше записей, выше шанс.\n\n' +
        '*Сколько записей даёт тариф Pro*\n' +
        'Неделя — 1 · Месяц — 2 · Полгода — 5 · Год — 10\n\n' +
        '*Тариф Pro+* (как у Pro, но +2 к каждой позиции)\n' +
        'Неделя — 3 · Месяц — 4 · Полгода — 7 · Год — 12\n\n' +
        '*Прозрачность*\n' +
        '• Фиксируем: ID пользователя, тариф/срок, дату/время, ID платежа, число записей (покупки суммируются).\n' +
        '• Победителей выбираем случайно и публикуем список в приложении.\n' +
        '• При возврате/отмене записи удаляются.\n\n' +
        '_Участвуют только успешные оплаты. Один человек — один аккаунт. Призы не обмениваются на деньги._';

      const deeplink = `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(GAME_STARTAPP_PARAM)}`;

      await tg('sendMessage', {
        chat_id: chatId,
        text: msg,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: 'Участвовать', url: deeplink }]] },
      });

      return NextResponse.json({ ok: true, stage: 'giveaway_sent' });
    }

    // --- /start ---
    if (text && chatId && /^\/start\b/i.test(text)) {
      const welcome =
        'Привет! Я твой персональный ассистент в Telegram.\n\n' +
        '🚀 Внутри — набор ежедневных инструментов: планы, здоровье, дом, контент, идеи и другое.\n\n' +
        'Нажми кнопку, чтобы открыть приложение.';

      const httpsDeeplink = `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(STARTAPP_PARAM)}`;

      await tg('sendMessage', {
        chat_id: chatId,
        text: welcome,
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: 'Открыть', url: httpsDeeplink }]] },
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
      const providerPaymentChargeId = sp.provider_payment_charge_id || null;

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
          providerPaymentChargeId: providerPaymentChargeId || undefined,
        },
      });

      // продление подписки
      await prisma.user.update({
        where: { id: u.id },
        data: { subscriptionUntil: until, plan: tier },
      });

      await tg('sendMessage', {
        chat_id: chatId,
        text:
          `✅ Подписка активна до ${until.toISOString().slice(0, 10)}.\n` +
          `Тариф: ${tier === 'PROPLUS' ? 'Pro+' : 'Pro'} — ${getPrices(tier)[plan].label}. Спасибо!`,
      });

      return NextResponse.json({ ok: true, stage: 'subscription_extended', tier, plan, until });
    }

    return NextResponse.json({ ok: true, noop: true });
  } catch (e: any) {
    console.error('[botWebhook] Error:', e);
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
