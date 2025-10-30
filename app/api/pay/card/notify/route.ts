/* path: app/api/pay/card/notify/route.ts */
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getVkRubKopecks, resolvePlan, resolveTier } from '@/lib/pricing';

export const runtime = 'nodejs';
const prisma = new PrismaClient();

// сколько дней даёт план (совпадает с lib/pricing.ts)
const PLAN_DAYS: Record<'WEEK'|'MONTH'|'HALF_YEAR'|'YEAR', number> = {
  WEEK:7, MONTH:30, HALF_YEAR:180, YEAR:365
};

export async function POST(req: Request) {
  try {
    const payload = await req.json(); // формата event-notification
    // НЕ доверяем на слово — вытянем платёж с сервера ЮKassa
    const paymentId: string | undefined = payload?.object?.id || payload?.object?.payment_id || payload?.id;
    const event = payload?.event;

    if (!paymentId) return NextResponse.json({ ok:false, error:'NO_PAYMENT_ID' }, { status:400 });

    // подтягиваем платёж
    const shopId = process.env.YK_SHOP_ID!;
    const secret = process.env.YK_SECRET_KEY!;
    const auth = Buffer.from(`${shopId}:${secret}`).toString('base64');

    const r = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const p = await r.json();
    if (!r.ok) return NextResponse.json({ ok:false, error:'PAYMENT_FETCH_FAILED', details:p }, { status:400 });

    if (p.status !== 'succeeded') {
      return NextResponse.json({ ok:true, ignored:true, status:p.status }); // ждём succeeded
    }

    // metadata, tier/plan и сумма
    const tier = resolveTier(p.metadata?.tier);
    const plan = resolvePlan(p.metadata?.plan);
    const amountRub = Number(p.amount?.value || 0); // "123.45" → 123.45
    const amountKop = Math.round(amountRub * 100);

    // На всякий: базовая цена (с учётом наших скидок уже выставлена в create)
    // Здесь можно повторно проверить, что сумма совпадает с ожидаемой.
    // Если хотите — раскомментируйте и сравнивайте.

    // userId/telegramId (хотя бы один желательно класть в metadata в create)
    const userId: string | undefined = p.metadata?.userId;
    const telegramId: string | undefined = p.metadata?.telegramId;

    if (!userId && !telegramId) {
      // как минимум телеграм-id нужен, иначе не знаем кому начислять
      return NextResponse.json({ ok:false, error:'NO_USER_REF' }, { status:400 });
    }

    // найдём пользователя
    const user = await prisma.user.findFirst({
      where: userId ? { id: userId } : { telegramId: String(telegramId || '') }
    });
    if (!user) return NextResponse.json({ ok:false, error:'USER_NOT_FOUND' }, { status:404 });

    // идемпотентность на уровне нашей базы: не дублируем один и тот же paymentId
    const already = await prisma.payment.findFirst({ where:{ providerPaymentChargeId: paymentId } });
    if (already) return NextResponse.json({ ok:true, duplicate:true });

    // Создаём запись Payment
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: user.telegramId,
        tier, plan,
        amount: amountKop,
        currency: 'RUB',
        days: PLAN_DAYS[plan],
        platform: 'WEB',
        provider: 'YKASSA',
        providerPaymentChargeId: paymentId,
        raw: p,
      }
    });

    // Начисляем подписку: продлеваем от максимума(сейчас или текущая дата окончания)
    const now = new Date();
    const from = user.subscriptionUntil && user.subscriptionUntil > now ? user.subscriptionUntil : now;
    const daysToAdd = PLAN_DAYS[plan];
    const newUntil = new Date(from.getTime() + daysToAdd*24*60*60*1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { plan: tier, subscriptionUntil: newUntil }
    });

    return NextResponse.json({ ok:true, applied:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}
