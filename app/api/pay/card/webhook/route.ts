/* path: app/api/pay/card/webhook/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const BOT_TOKEN  = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const SHOP_ID    = process.env.YK_SHOP_ID || '';
const SECRET_KEY = process.env.YK_SECRET_KEY || '';

type Tier = 'PRO' | 'PROPLUS';
type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';

function addDays(date: Date, days: number) { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d; }
function daysFor(plan: Plan): number {
  switch (plan) {
    case 'WEEK': return 7;
    case 'MONTH': return 30;
    case 'HALF_YEAR': return 183;
    case 'YEAR': return 365;
  }
}
function fmtDate(d: Date) {
  const dd = String(d.getDate()).padStart(2,'0');
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const yy = d.getFullYear();
  return `${dd}.${mm}.${yy}`;
}
async function tg(method: string, payload: any) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload),
    });
  } catch {}
}

export async function POST(req: Request) {
  try {
    const event = await req.json().catch(()=> ({}));
    const paymentId = event?.object?.id as string | undefined;
    if (!paymentId) return NextResponse.json({ ok: true, skipped: 'no_id' });

    if (!SHOP_ID || !SECRET_KEY) return NextResponse.json({ ok:false, error:'YKassa env not set' }, { status:500 });

    // Подтверждаем у ЮKassa
    const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');
    const r = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: { 'Authorization': `Basic ${auth}` }, cache: 'no-store',
    });
    const data = await r.json();

    if (data?.status !== 'succeeded') {
      return NextResponse.json({ ok:true, skipped:'not_succeeded', status:data?.status || 'unknown' });
    }

    const meta = data?.metadata || {};
    const tier = String(meta.tier || '').toUpperCase() as Tier;
    const plan = String(meta.plan || '').toUpperCase() as Plan;
    const key: string | undefined =
      typeof meta.telegramId === 'string' ? meta.telegramId :
      typeof meta.userId === 'string'      ? meta.userId      : undefined;
    const isTrial = meta?.trial === '1' || meta?.trial === 1 || meta?.trial === true;

    if (!key || !['PRO','PROPLUS'].includes(tier) || !['WEEK','MONTH','HALF_YEAR','YEAR'].includes(plan)) {
      return NextResponse.json({ ok:false, error:'META_MISSING_OR_BAD', meta }, { status:400 });
    }

    // Идемпотентность по paymentId
    const dup = await prisma.payment.findFirst({
      where: { providerPaymentChargeId: paymentId },
      select: { id: true },
    });
    if (dup) return NextResponse.json({ ok:true, stage:'already_processed' });

    // Пользователь
    let user = await prisma.user.findUnique({ where: { telegramId: key } });
    if (!user) user = await prisma.user.create({ data: { telegramId: key } });

    // Продление: 1 день для триала, иначе полноценный план
    const add = isTrial ? 1 : daysFor(plan);
    const now = new Date();
    const from = (user.subscriptionUntil && user.subscriptionUntil > now) ? user.subscriptionUntil : now;
    const until = addDays(from, add);

    // Сохранённый платёжный метод (если запрошен в триале)
    const paymentMethodId: string | undefined = data?.payment_method?.id || undefined;
    const customerId: string | undefined = data?.customer?.id || undefined;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionUntil: until,
        plan: tier,
        ...(isTrial ? {
          trialActive: true,
          trialStartedAt: now,
          autopayActive: true,
          autopayTier: tier,
          autopayPlan: 'MONTH',
          autopayNextAt: addDays(now, 1),
        } : {}),
        ...(paymentMethodId ? { ykPaymentMethodId: paymentMethodId } : {}),
        ...(customerId ? { ykCustomerId: customerId } : {}),
      },
    });

    // Сумма
    const amountStr = String(data?.amount?.value || '0');
    const kopecks = Math.round(Number(amountStr) * 100);
    const currency = String(data?.amount?.currency || 'RUB');

    // Логи
    await prisma.cardPayment.create({
      data: {
        paymentId,
        telegramId: key,
        tier, plan,
        amountKopecks: kopecks,
        currency,
        paymentMethodId: paymentMethodId,
        customerId: customerId,
        isTrial,
        meta: data,
      },
    });

    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: key,
        payload: `yk:${tier}:${plan}${isTrial?':trial':''}`,
        tier, plan,
        amount: kopecks,
        currency,
        days: add,
        platform: 'WEB',
        provider: 'YKASSA',
        providerPaymentChargeId: paymentId,
        raw: { id: data?.id, status: data?.status, metadata: data?.metadata },
      },
    });

    if (/^\d+$/.test(key) && BOT_TOKEN) {
      const prettyTier = tier === 'PROPLUS' ? 'Pro+' : 'Pro';
      await tg('sendMessage', {
        chat_id: Number(key),
        text: isTrial
          ? `✅ Оплата прошла. Активирован *пробный доступ* (${prettyTier}) до *${fmtDate(until)}*`
          : `✅ Оплата картой прошла успешно.\nПодписка *${prettyTier}* активна до *${fmtDate(until)}*.`,
        parse_mode: 'Markdown',
      });
    }

    return NextResponse.json({ ok:true, userId:key, tier, plan, until, isTrial, providerPaymentChargeId: paymentId });
  } catch (e:any) {
    return NextResponse.json({ ok:true, error:String(e?.message||e) });
  }
}
