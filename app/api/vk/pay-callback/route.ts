// app/api/vk/pay-callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Tier, type Plan } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VK_SECURE_KEY = (process.env.VK_SECURE_KEY || '').trim();

function b64url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/,'');
}

/** Сортируем все пары k=v (кроме sign/signature/sig), склеиваем через & и считаем HMAC-SHA256(secret) -> base64url */
function makeCanonicalSign(all: Record<string, string>): string {
  const pairs = Object.entries(all)
    .filter(([k]) => !/^sig(nature)?$/i.test(k))
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${k}=${v}`);
  const h = crypto.createHmac('sha256', VK_SECURE_KEY);
  h.update(pairs.join('&'));
  return b64url(h.digest());
}

/** Бэкап-вариант: простая подпись по ключевым полям (совместимость с тестовыми проксями) */
function makeFallbackSign(user_id: string, order_id: string, amount: string, status: string) {
  const h = crypto.createHmac('sha256', VK_SECURE_KEY);
  h.update(`${user_id}:${order_id}:${amount}:${status}`);
  return h.digest('hex');
}

/** Парсим копейки из "399.00", "399,00", "399" или числа */
function parseAmountToKopecks(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return Math.round(v * 100);
  }
  if (typeof v === 'string') {
    const s = v.trim().replace(',', '.');
    const num = Number(s);
    if (Number.isFinite(num)) return Math.round(num * 100);
    const int = parseInt(v, 10);
    if (Number.isFinite(int)) return int; // уже копейки
  }
  return null;
}

/** Достаём tier/plan/user из твоего order_id: lm_<tier>_<plan>_<vkuid>_<ts> */
function parseFromOrderId(order_id: string) {
  const m = /^lm_(pro|proplus)_(week|month|half_year|year)_(\d+)_\d+$/i.exec(order_id || '');
  if (!m) return null;
  const [, tierRaw, planRaw, vkUid] = m;
  const tier = resolveTier(tierRaw) as Tier;
  const plan = resolvePlan(planRaw.replace(/_/g, '-')) as Plan;
  return { tier, plan, vkUid };
}

/** Нормализация статуса */
function isSuccessStatus(v?: string | null) {
  const s = String(v || '').toLowerCase();
  // покрываем типичные варианты VK Pay
  return ['success', 'ok', 'paid', 'confirmed', 'done', 'charged', 'chargeable'].includes(s);
}

/** Универсальный парсер GET/POST: JSON или form-urlencoded */
async function readParams(req: NextRequest): Promise<Record<string,string>> {
  const params: Record<string,string> = {};
  // 1) query
  const q = new URL(req.url).searchParams;
  q.forEach((v,k) => params[k] = v);

  // 2) body
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const json = await req.json().catch(() => ({}));
    for (const [k,v] of Object.entries(json || {})) {
      if (v !== undefined && v !== null) params[k] = String(v);
    }
  } else if (ct.includes('application/x-www-form-urlencoded')) {
    const text = await req.text().catch(()=>'');
    const sp = new URLSearchParams(text);
    sp.forEach((v,k) => params[k] = v);
  }

  return params;
}

async function handle(req: NextRequest) {
  try {
    if (!VK_SECURE_KEY) {
      return NextResponse.json({ ok: false, error: 'VK_SECURE_KEY_MISSING' }, { status: 500 });
    }

    const p = await readParams(req);

    // базовые поля, которые ожидаем увидеть
    const order_id = p.order_id || '';
    const status   = p.status || p.payment_status || '';
    const user_id  = p.user_id || p.vk_user_id || '';
    const amountK  = parseAmountToKopecks(p.amount ?? p.amount_kop ?? p.sum);

    if (!order_id) return NextResponse.json({ ok:false, error:'NO_ORDER_ID' }, { status: 400 });

    // в VK официально приходит sign (или signature/sig) — пробуем каноническую проверку
    const remoteSign = p.sign || p.signature || p.sig || '';
    let signOk = false;
    if (remoteSign) {
      const canon = makeCanonicalSign(p);
      if (canon === remoteSign) signOk = true;
      // совместимость с простым вариантом
      if (!signOk && user_id && (p.amount || p.amount_kop || p.sum)) {
        const fb = makeFallbackSign(user_id, order_id, String(p.amount ?? p.amount_kop ?? p.sum), status);
        if (fb === remoteSign) signOk = true;
      }
    }

    if (!signOk && remoteSign) {
      // подпись была, но не совпала — отбрасываем
      return NextResponse.json({ ok:false, error:'BAD_SIGN' }, { status: 403 });
    }

    // Разбираем tier/plan из order_id (именно так ты его собираешь в create-order)
    const parsed = parseFromOrderId(order_id);
    if (!parsed) return NextResponse.json({ ok:false, error:'BAD_ORDER_ID_FORMAT' }, { status: 400 });
    const { tier, plan, vkUid } = parsed;
    const vkKey = `vk:${vkUid}`;

    // если статус передан и он неуспешный — логируем и отвечаем ок, но без продления
    if (status && !isSuccessStatus(status)) {
      return NextResponse.json({ ok:true, stage:'ignored_status', status });
    }

    // Проверка суммы
    const price = getPrices(tier)[plan];
    // В твоей схеме VK-цена хранится в копейках в getPriceFor(tier, plan, 'VK').amount
    const expectedKop = (await import('@/lib/pricing')).getPriceFor(tier, plan, 'VK').amount;
    if (amountK !== null && Math.abs(amountK - expectedKop) > 0) {
      // если VK прислал сумму — проверяем ровно; если не прислал, пропускаем
      return NextResponse.json({ ok:false, error:'AMOUNT_MISMATCH', expected: expectedKop, got: amountK }, { status: 400 });
    }

    // идемпотентность: не дублируем один и тот же order_id
    const dup = await prisma.payment.findFirst({
      where: { telegramId: vkKey, providerPaymentChargeId: order_id },
      select: { id: true },
    });
    if (dup) {
      return NextResponse.json({ ok:true, stage:'already_processed' });
    }

    // upsert пользователя
    const u = await prisma.user.upsert({
      where: { telegramId: vkKey },
      update: { plan: tier },
      create: { telegramId: vkKey, plan: tier },
      select: { id: true, subscriptionUntil: true },
    });

    // продлеваем подписку
    const days = price.days;
    const now = new Date();
    const from = u.subscriptionUntil && u.subscriptionUntil > now ? u.subscriptionUntil : now;
    const until = new Date(from);
    until.setUTCDate(until.getUTCDate() + days);

    // лог платежа
    await prisma.payment.create({
      data: {
        userId: u.id,
        telegramId: vkKey,                 // в этом поле у нас ключ пользователя
        payload: `vk:${tier}:${plan}`,
        tier,
        plan,
        amount: expectedKop,               // копейки
        currency: 'RUB',
        days,
        providerPaymentChargeId: order_id, // внешний идентификатор
      },
    });

    await prisma.user.update({
      where: { id: u.id },
      data: { subscriptionUntil: until, plan: tier },
    });

    return NextResponse.json({ ok:true, stage:'subscription_extended', tier, plan, until: until.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return handle(req); }
export async function GET(req: NextRequest)  { return handle(req); }
