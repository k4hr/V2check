// app/api/pay/cryptopay/webhook/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRYPTO_PAY_WEBHOOK_SECRET = (process.env.CRYPTO_PAY_WEBHOOK_SECRET || '').trim();
// опционально — если хочешь ещё уведомлять юзера в TG:
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

async function tg(method: string, payload: any) {
  if (!BOT_TOKEN) return null;
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.json().catch(() => ({}));
}

// payload формируем как: cpay:subs2:TIER:PLAN[:TGID]
function parsePayload(raw: string): { tier: Tier; plan: Plan; tgId?: string } | null {
  const s = String(raw || '');
  const m = /^cpay:subs2:([A-Za-z_]+):([A-Za-z_]+)(?::(\d+))?$/i.exec(s);
  if (!m) return null;
  const tier = resolveTier(m[1]);
  const plan = resolvePlan(m[2]);
  const tgId = m[3] ? String(m[3]) : undefined;
  return { tier, plan, tgId };
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    // простой секрет через query для быстрого запуска
    if (CRYPTO_PAY_WEBHOOK_SECRET) {
      const got = (new URL(req.url)).searchParams.get('secret') || '';
      if (got !== CRYPTO_PAY_WEBHOOK_SECRET) {
        return NextResponse.json({ ok: false, error: 'WEBHOOK_FORBIDDEN' }, { status: 403 });
      }
    }

    const update = await req.json().catch(() => ({}));
    // Crypto Pay присылает разные формы, но нас интересует оплата инвойса
    // Пробуем вытащить объект с полями invoice_id/amount/asset/payload
    const paid =
      update?.invoice_paid ||
      update?.payload ||
      update?.update || // на всякий
      update;

    const invoice = paid?.invoice || paid; // местами вложено

    const invoiceId = String(invoice?.invoice_id || '');
    const asset     = String(invoice?.asset || '');
    const payload   = String(invoice?.payload || '');

    if (!invoiceId || !payload) {
      // ничего полезного — молча ок
      return NextResponse.json({ ok: true, noop: true });
    }

    const parsed = parsePayload(payload);
    if (!parsed) {
      return NextResponse.json({ ok: false, error: 'BAD_PAYLOAD' }, { status: 400 });
    }

    const { tier, plan, tgId } = parsed;

    // idempotency: invoice_id уникален для Crypto Pay
    const exists = await prisma.payment.findFirst({
      where: { providerPaymentChargeId: invoiceId },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ ok: true, stage: 'already_processed' });
    }

    // если знаем telegramId — находим/создаём юзера
    let user = null as null | { id: string; subscriptionUntil: Date | null };
    if (tgId) {
      user = await prisma.user.upsert({
        where: { telegramId: String(tgId) },
        create: { telegramId: String(tgId), plan: tier },
        update: { plan: tier },
        select: { id: true, subscriptionUntil: true },
      });
    } else {
      // fallback: создадим «технического» пользователя на всякий случай
      user = await prisma.user.create({
        data: { telegramId: `cpay-${invoiceId}`, plan: tier },
        select: { id: true, subscriptionUntil: true },
      });
    }

    const prices = getPrices(tier);
    const days = prices[plan].days;

    const now = new Date();
    const from = user.subscriptionUntil && user.subscriptionUntil > now ? user.subscriptionUntil : now;
    const until = addDays(from, days);

    // лог платежа (amount храним в «звёздах» как у Stars для унификации)
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: String(tgId || ''),
        payload,
        tier,
        plan,
        amount: prices[plan].stars,
        currency: asset || 'CRYPTO',
        days,
        // для Crypto Pay складываем invoice_id в providerPaymentChargeId
        providerPaymentChargeId: invoiceId,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionUntil: until, plan: tier },
    });

    // уведомим в TG (если есть tgId и BOT_TOKEN)
    if (tgId) {
      try {
        await tg('sendMessage', {
          chat_id: tgId,
          text:
            `✅ Оплата получена. Подписка активна до ${until.toISOString().slice(0, 10)}.\n` +
            `Тариф: ${tier === 'PROPLUS' ? 'Pro+' : 'Pro'} — ${prices[plan].label}. Спасибо!`,
        });
      } catch {}
    }

    return NextResponse.json({ ok: true, stage: 'subscription_extended', tier, plan, until, invoice_id: invoiceId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
