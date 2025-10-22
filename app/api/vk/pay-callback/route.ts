// app/api/vk/pay-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VK_SECURE_KEY = (process.env.VK_SECURE_KEY || '').trim();

type VkPayPayload = {
  user_id: number;   // VK user id
  order_id: string;  // id заказа в твоей системе/эквайере
  tier: string;      // 'PRO' | 'PROPLUS'
  plan: string;      // 'WEEK' | 'MONTH' | 'HALF_YEAR' | 'YEAR'
  amount: number;    // сумма в КОПЕЙКАХ (integer)
  sign: string;      // подпись
};

// Простейший HMAC-подпись: приведи формат к тому, что используешь на стороне VK/бэка
function makeSign(data: Omit<VkPayPayload, 'sign'>): string {
  const h = crypto.createHmac('sha256', VK_SECURE_KEY);
  h.update(`${data.user_id}:${data.order_id}:${data.tier}:${data.plan}:${data.amount}`);
  return h.digest('hex');
}

// Health-check на GET (чтобы не пугал белым экраном)
export async function GET() {
  return NextResponse.json({ ok: true, ping: 'vk pay callback alive' });
}

export async function POST(req: NextRequest) {
  try {
    if (!VK_SECURE_KEY) {
      return NextResponse.json({ ok: false, error: 'VK_SECURE_KEY_MISSING' }, { status: 500 });
    }

    const body = (await req.json()) as VkPayPayload;

    // Базовая валидация
    if (!body?.user_id || !body?.order_id || !body?.tier || !body?.plan || typeof body?.amount !== 'number' || !body?.sign) {
      return NextResponse.json({ ok: false, error: 'BAD_REQUEST' }, { status: 400 });
    }

    // Проверка подписи
    const { sign, ...raw } = body;
    const calc = makeSign(raw);
    if (sign !== calc) {
      return NextResponse.json({ ok: false, error: 'BAD_SIGN' }, { status: 403 });
    }

    const tier = resolveTier(raw.tier) as Tier;
    const plan = resolvePlan(raw.plan) as Plan;

    // Псевдо-ид для совместимости со схемой (не меняем Prisma-модель):
    // храним VK-пользователя в поле telegramId как 'vk:<vk_user_id>'
    const vkKey = `vk:${raw.user_id}`;

    // Идемпотентность: если уже есть платеж с таким order_id для этого vkKey — выходим
    const dup = await prisma.payment.findFirst({
      where: { telegramId: vkKey, providerPaymentChargeId: raw.order_id },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json({ ok: true, stage: 'already_processed' });
    }

    // upsert пользователя
    const u = await prisma.user.upsert({
      where: { telegramId: vkKey },
      update: { plan: tier },
      create: { telegramId: vkKey, plan: tier },
      select: { id: true, subscriptionUntil: true },
    });

    // Продление подписки
    const prices = getPrices(tier);
    const days = prices[plan].days;
    const now = new Date();
    const from = u.subscriptionUntil && u.subscriptionUntil > now ? u.subscriptionUntil : now;
    const until = new Date(from);
    until.setUTCDate(until.getUTCDate() + days);

    // Лог платежа (используем существующие поля схемы)
    await prisma.payment.create({
      data: {
        userId: u.id,
        telegramId: vkKey,                    // кладём vkKey сюда — поле обязательно в схеме
        payload: `vk:${tier}:${plan}`,        // метка-источник
        tier,
        plan,
        amount: raw.amount,                   // сумма в копейках (да, поле называлось для Stars — тут просто лог)
        currency: 'RUB',                      // валюта — рубли
        days,
        providerPaymentChargeId: raw.order_id // кладём айди заказа в провайдере
        // telegramChargeId не задаём
      },
    });

    await prisma.user.update({
      where: { id: u.id },
      data: { subscriptionUntil: until, plan: tier },
    });

    return NextResponse.json({ ok: true, stage: 'subscription_extended', tier, plan, until: until.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
