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
    date?: number;
    from?: { id?: number; username?: string; first_name?: string; last_name?: string };
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

// --- мини-обёртка для Telegram API ---
async function tg(method: string, payload: any) {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (e) {
    console.error('[botWebhook] send error', method, e);
    return null;
  }
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
      // Возвращаем 200, чтобы TG не спамил ретраями — но в логи пишем ошибку
      console.error('[botWebhook] BOT_TOKEN missing');
      return NextResponse.json({ ok: true, error: 'BOT_TOKEN_MISSING' });
    }

    // Секрет вебхука
    const got = (req.headers.get('x-telegram-bot-api-secret-token') || '').trim();
    if (WH_SECRET && got !== WH_SECRET) {
      // отвечаем 200 ok, чтобы не было ретраев
      console.warn('[botWebhook] Forbidden: bad secret', { got });
      return NextResponse.json({ ok: true, skip: 'WEBHOOK_FORBIDDEN' });
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;
    const msg    = update.message;
    const text   = msg?.text?.trim() || '';
    const chatId = msg?.chat?.id || msg?.from?.id;

    // быстрые ветки, не требующие дальнейшей обработки
    if (!msg || !chatId || msg.chat?.type !== 'private') {
      return NextResponse.json({ ok: true, skip: 'no_private_message' });
    }

    // ---- апсёрт пользователя (для любой приватной активности) ----
    const tgId = String(chatId);
    const username = msg.from?.username || msg.chat?.username || null;
    const firstName = msg.from?.first_name || null;
    const lastName  = msg.from?.last_name || null;

    const user = await prisma.user.upsert({
      where: { telegramId: tgId },
      create: {
        telegramId: tgId,
        username,
        firstName,
        lastName,
        lastSeenAt: new Date(),
      },
      update: {
        username: username || undefined,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        lastSeenAt: new Date(),
      },
      select: { id: true, telegramId: true, username: true },
    });

    // --- /support ---
    if (/^\/support\b/i.test(text)) {
      await tg('sendMessage', {
        chat_id: chatId,
        text: '💬 Поддержка: @LiveManagerSupport',
      });
      return NextResponse.json({ ok: true, stage: 'support_sent' });
    }

    // --- /10gpt --- розыгрыш
    if (/^\/10gpt\b/i.test(text)) {
      const msgBody =
        '🎁 <b>Розыгрыш подписок CHATGPT 5</b>\n\n' +
        'Разыгрываем 80 призов среди пользователей приложения:\n' +
        '• 10 годовых, 20 полугодовых и 50 месячных подписок.\n\n' +
        '<b>Сроки.</b> До <b>01.01.2026</b> (включительно). Покупки в этот период участвуют автоматически.\n\n' +
        '<b>Как участвовать</b>\n' +
        '1) Оформите любую платную подписку в приложении.\n' +
        '2) Каждая покупка = несколько записей (больше записей — выше шанс).\n\n' +
        '<i>Прозрачность: фиксируем ID, тариф/срок, дату, ID платежа и число записей. Возвраты — записи удаляются.</i>';

      const deeplink = `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(GAME_STARTAPP_PARAM)}`;

      await tg('sendMessage', {
        chat_id: chatId,
        text: msgBody,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: 'Участвовать', url: deeplink }]] },
      });

      return NextResponse.json({ ok: true, stage: 'giveaway_sent' });
    }

    // --- /start ---
    if (/^\/start\b/i.test(text)) {
      // логируем факт старта
      const payload = text.slice(6).trim() || null;
      await prisma.startEvent.create({
        data: {
          userId: user.id,
          chatId: tgId,
          username: user.username || null,
          payload,
          via: 'private',
          // meta: update, // если захочешь хранить сырой апдейт
        },
      });

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

    // --- /help (и неизвестные команды) ---
    if (/^\/help\b/i.test(text) || text.startsWith('/')) {
      await tg('sendMessage', {
        chat_id: chatId,
        text:
          '📖 Доступные команды:\n' +
          '/start — активация\n' +
          '/10gpt — розыгрыш\n' +
          '/support — поддержка\n' +
          '/help — помощь',
      });
      return NextResponse.json({ ok: true, stage: 'help_sent' });
    }

    // --- Pre-checkout fast ack ---
    if (update.pre_checkout_query) {
      const { id } = update.pre_checkout_query;
      await tg('answerPreCheckoutQuery', { pre_checkout_query_id: id, ok: true });
      return NextResponse.json({ ok: true, stage: 'pre_checkout_ok' });
    }

    // --- Успешная оплата / продление подписки ---
    const sp = msg.successful_payment;
    if (sp) {
      const parsed = parsePayload(sp.invoice_payload);
      if (!parsed) return NextResponse.json({ ok: true, error: 'BAD_PAYLOAD' });

      const { tier, plan } = parsed;

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

      // upsert пользователя (мог быть без планов)
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

    // если это обычное сообщение — можно молча игнорировать
    return NextResponse.json({ ok: true, noop: true });
  } catch (e: any) {
    // Возвращаем 200, чтобы Telegram не ретраил, и логируем
    console.error('[botWebhook] Error:', e);
    return NextResponse.json({ ok: true, error: e?.message || 'SERVER_ERROR' });
  }
}
