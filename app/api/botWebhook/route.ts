// app/api/botWebhook/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const WH_SECRET = (process.env.TG_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '').trim();

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
    chat?: { id?: number; username?: string };
    successful_payment?: {
      invoice_payload: string; // "subs:<tier>:<plan>" либо "subs:<plan>" (старый формат)
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

/** Разбор payload, совместимый со старым форматом.
 *  Новое:  "subs:pro:MONTH" | "subs:proplus:YEAR"
 *  Старое: "subs:MONTH"
 */
function parsePayload(payload: string): { tier: Tier; plan: Plan } | null {
  const raw = String(payload || '');
  const mNew = /^subs:([a-z+]+):([A-Z_]+)$/i.exec(raw);
  if (mNew) {
    const tier = resolveTier(mNew[1]);
    const plan = resolvePlan(mNew[2]);
    return { tier, plan };
  }
  const mOld = /^subs:([A-Z_]+)$/i.exec(raw);
  if (mOld) {
    return { tier: 'pro', plan: resolvePlan(mOld[1]) }; // дефолтим старые платежи к Pro
  }
  return null;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });

    // Защита вебхука секретом
    if (WH_SECRET) {
      const got = (req.headers.get('x-telegram-bot-api-secret-token') || '').trim();
      if (got !== WH_SECRET) return NextResponse.json({ ok:false, error:'WEBHOOK_FORBIDDEN' }, { status:403 });
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;

    // Быстрый ответ на pre_checkout_query (оставляем как было)
    if (update.pre_checkout_query) {
      const { id } = update.pre_checkout_query;
      await tg('answerPreCheckoutQuery', { pre_checkout_query_id: id, ok: true });
      return NextResponse.json({ ok: true, stage: 'pre_checkout_ok' });
    }

    // Успешный платёж -> продлеваем подписку
    const sp = update.message?.successful_payment;
    const chatId = update.message?.chat?.id || update.message?.from?.id;
    if (sp && chatId) {
      const parsed = parsePayload(sp.invoice_payload);
      if (!parsed) {
        return NextResponse.json({ ok: false, error: 'BAD_PAYLOAD' }, { status: 400 });
      }

      const { tier, plan } = parsed;
      const prices = getPrices(tier);
      const cfg = prices[plan];
      const username =
        update.message?.from?.username ||
        update.message?.chat?.username ||
        null;

      // upsert пользователя
      const u = await prisma.user.upsert({
        where: { telegramId: String(chatId) },
        create: { telegramId: String(chatId), ...(username ? { username } : {}) },
        update: { ...(username ? { username } : {}) },
      });

      // Пока храним единую дату подписки, как и раньше
      const now = new Date();
      const from = u.subscriptionUntil && u.subscriptionUntil > now ? u.subscriptionUntil : now;
      const until = addDays(from, cfg.days);

      await prisma.user.update({
        where: { id: u.id },
        data: {
          subscriptionUntil: until,
          updatedAt: new Date(),
          // Если решите держать последний купленный tier — добавьте колонку, см. заметку ниже.
          // lastTier: tier as any
        },
      });

      try {
        await tg('sendMessage', {
          chat_id: chatId,
          text: `✅ Оплачено: ${cfg.title} (${tier === 'proplus' ? 'Pro+' : 'Pro'}).\nПодписка активна до ${until.toISOString().slice(0,10)}. Спасибо за покупку!`,
        });
      } catch {}

      return NextResponse.json({ ok: true, stage: 'subscription_extended', tier, plan, until });
    }

    return NextResponse.json({ ok: true, noop: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
