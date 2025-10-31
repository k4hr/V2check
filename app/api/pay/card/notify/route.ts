import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

type Tier = 'PRO' | 'PROPLUS';
type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
function daysFor(plan: Plan): number {
  switch (plan) {
    case 'WEEK': return 7;
    case 'MONTH': return 30;
    case 'HALF_YEAR': return 183; // 6 месяцев с буфером
    case 'YEAR': return 365;
  }
}

export async function POST(req: Request) {
  try {
    // Примечание: здесь без верификации подписи вебхука.
    // Если понадобится, можно добавить проверку заголовков YooKassa.
    const body = await req.json();
    const type = body?.event || body?.type;
    const object = body?.object;
    if (!type || !object) {
      return NextResponse.json({ ok:false, error:'BAD_WEBHOOK_BODY' }, { status:400 });
    }
    if (String(type) !== 'payment.succeeded' || String(object?.status) !== 'succeeded') {
      return NextResponse.json({ ok:true, skipped:true });
    }

    const meta = object?.metadata || {};
    const tier = String(meta.tier || '').toUpperCase() as Tier;
    const plan = String(meta.plan || '').toUpperCase() as Plan;

    const key: string | undefined =
      typeof meta.telegramId === 'string' ? meta.telegramId :
      typeof meta.userId === 'string' ? meta.userId :
      undefined;

    if (!key || !['PRO','PROPLUS'].includes(tier) || !['WEEK','MONTH','HALF_YEAR','YEAR'].includes(plan)) {
      return NextResponse.json({ ok:false, error:'META_MISSING_OR_BAD', meta }, { status:400 });
    }

    const paymentId = String(object?.id || '');
    const amountStr = String(object?.amount?.value || '0'); // "123.45"
    const currency  = String(object?.amount?.currency || 'RUB');
    const amountKopecks = Math.round(Number(amountStr) * 100);

    // гарантируем наличие пользователя
    let user = await prisma.user.findUnique({ where: { telegramId: key } });
    if (!user) {
      user = await prisma.user.create({ data: { telegramId: key } });
    }

    // продлеваем подписку
    const add = daysFor(plan);
    const now = new Date();
    const from = (user.subscriptionUntil && user.subscriptionUntil > now) ? user.subscriptionUntil : now;
    const until = addDays(from, add);

    await prisma.user.update({
      where: { telegramId: key },
      data: { subscriptionUntil: until, plan: tier },
    });

    // логируем платёж в отдельную таблицу (идемпотентно по paymentId)
    await prisma.cardPayment.upsert({
      where: { paymentId },
      create: {
        paymentId,
        telegramId: key,
        tier,
        plan,
        amountKopecks,
        currency,
        meta: object,
      },
      update: {}, // дубль — ничего не меняем
    });

    return NextResponse.json({ ok:true, userId:key, tier, plan, until, paymentId, amountKopecks, currency });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}

export const GET = POST; // на всякий случай
