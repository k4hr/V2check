import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ЮKassa шлёт JSON с полями object{id, status, metadata, amount, ...}
export const runtime = 'nodejs';

type Tier = 'PRO' | 'PROPLUS';
type Plan = 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR';

function addDays(date: Date, days: number) {
  const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d;
}
function daysFor(plan: Plan): number {
  switch (plan) {
    case 'WEEK': return 7;
    case 'MONTH': return 30;
    case 'HALF_YEAR': return 183; // полгода ≈ 6×30 + буфер
    case 'YEAR': return 365;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // Минимальная валидация события
    const type = body?.event || body?.type; // иногда приходит "payment.succeeded"
    const object = body?.object;
    if (!type || !object) {
      return NextResponse.json({ ok:false, error:'BAD_WEBHOOK_BODY' }, { status:400 });
    }
    if (String(type) !== 'payment.succeeded' || String(object?.status) !== 'succeeded') {
      // игнорим всё, что не успешная оплата
      return NextResponse.json({ ok:true, skipped:true });
    }

    const meta = object?.metadata || {};
    const tier = String(meta.tier || '').toUpperCase() as Tier;
    const plan = String(meta.plan || '').toUpperCase() as Plan;

    // Идентификатор пользователя, который мы прокидывали из клиента при создании платежа
    // В твоей модели user.telegramId хранится как '123456' (tg) или 'vk:12345' (vk).
    const key: string | undefined =
      typeof meta.telegramId === 'string' ? meta.telegramId :
      typeof meta.userId === 'string' ? meta.userId :
      undefined;

    if (!key || !['PRO','PROPLUS'].includes(tier) || !['WEEK','MONTH','HALF_YEAR','YEAR'].includes(plan)) {
      return NextResponse.json({ ok:false, error:'META_MISSING_OR_BAD', meta }, { status:400 });
    }

    // Находим пользователя
    const user = await prisma.user.findUnique({ where: { telegramId: key } });
    if (!user) {
      // На крайний случай — создадим, чтобы не потерять оплату
      await prisma.user.create({ data: { telegramId: key } });
    }

    // Дни, которые нужно добавить
    const add = daysFor(plan);

    // Текущее «до» (если уже есть активная подписка — продлеваем от этого момента)
    const now = new Date();
    const from = (user?.subscriptionUntil && user.subscriptionUntil > now)
      ? user.subscriptionUntil
      : now;

    const until = addDays(from, add);

    await prisma.user.update({
      where: { telegramId: key },
      data: {
        subscriptionUntil: until,
        plan: tier, // 'PRO' | 'PROPLUS'
      },
    });

    return NextResponse.json({ ok:true, userId:key, tier, plan, until });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}
