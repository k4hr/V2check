/* path: app/api/vk/create-order/route.ts */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resolvePlan, resolveTier, getPriceFor, type Plan, type Tier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VK_SECURE_KEY  = (process.env.VK_SECURE_KEY || '').trim();
const VK_APP_ID      = Number(process.env.NEXT_PUBLIC_VK_APP_ID || process.env.VK_APP_ID || 0);
const VK_MERCHANT_ID = (process.env.VK_MERCHANT_ID || '').trim();

/** vk_* сортируем, склеиваем в k=v&... (без sign) и сверяем */
function toCanonicalVkQueryString(sp: URLSearchParams): string {
  const pairs: [string,string][] = [];
  sp.forEach((v, k) => { if (k.startsWith('vk_')) pairs.push([k, v]); });
  pairs.sort(([a],[b]) => a.localeCompare(b));
  return pairs.map(([k,v]) => `${k}=${v}`).join('&');
}
function verifyVkParams(raw: string, secret: string): { ok: boolean; vkUserId?: string } {
  if (!raw || !secret) return { ok: false };
  const sp = new URLSearchParams(raw);
  const sign = sp.get('sign') || '';
  if (!sign) return { ok: false };

  const base = toCanonicalVkQueryString(sp);
  const h = crypto.createHmac('sha256', secret).update(base);
  const digest = h.digest('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  if (digest !== sign) return { ok: false };

  const uid = sp.get('vk_user_id') || '';
  return uid ? { ok: true, vkUserId: uid } : { ok: false };
}

/** ASCII-описание без «—», ₽ и эмодзи */
function asciiDescription(label: string): string {
  const s = (label || '')
    .replace(/—/g, '-')            // длинное тире -> дефис
    .replace(/[₽]/g, 'RUB')        // знак рубля -> RUB
    .replace(/[^\x20-\x7E]+/g, ' ')// уберём не-ASCII
    .replace(/\s+/g, ' ')
    .trim();
  return s || 'LiveManager Pro';
}

/** Строгий order_id: [A-Za-z0-9_-], длина ≤ 64 */
function makeOrderId(vkUserId: string, tier: Tier, plan: Plan, suffix = '') {
  const raw = `lm_${tier.toLowerCase()}_${plan.toLowerCase()}${suffix}_${vkUserId}_${Date.now()}`;
  return raw.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
}

/** "399.00" */
function toAmountStringFromKopecks(kopecks: number): string {
  const rub = (kopecks ?? 0) / 100;
  return (Math.round(rub * 100) / 100).toFixed(2);
}

export async function POST(req: NextRequest) {
  try {
    if (!VK_APP_ID)      return NextResponse.json({ ok: false, error: 'VK_APP_ID_MISSING' }, { status: 500 });
    if (!VK_MERCHANT_ID) return NextResponse.json({ ok: false, error: 'VK_MERCHANT_ID_MISSING' }, { status: 500 });
    if (!VK_SECURE_KEY)  return NextResponse.json({ ok: false, error: 'VK_SECURE_KEY_MISSING' }, { status: 500 });

    const url = new URL(req.url);

    // tier/plan из query + строгая нормализация
    const tier = resolveTier(url.searchParams.get('tier'));
    const plan = resolvePlan(url.searchParams.get('plan'));
    if (!tier || !plan) {
      return NextResponse.json({ ok: false, error: 'BAD_TIER_OR_PLAN' }, { status: 400 });
    }

    // Валидируем VK launch-параметры (из заголовка или cookie)
    const rawVk = req.headers.get('x-vk-params') || req.cookies.get('vk_params')?.value || '';
    const { ok, vkUserId } = verifyVkParams(rawVk, VK_SECURE_KEY);
    if (!ok || !vkUserId) {
      return NextResponse.json({ ok: false, error: 'BAD_VK_PARAMS' }, { status: 401 });
    }

    // Читаем тело (email/telegramId нам не нужны для VKPay, но trial важен)
    const body = await req.json().catch(() => ({} as any));
    const trial = Boolean(body?.trial) || url.searchParams.get('trial') === '1';

    // Цена и текстовые поля из pricing
    const priced = getPriceFor(tier, plan, 'VK'); // { amount(kopecks), currency:'RUB', days, label, title, description }
    if (priced.currency !== 'RUB') {
      return NextResponse.json({ ok: false, error: 'PRICING_CONFIG_ERROR' }, { status: 500 });
    }

    // Готовим сумму и описание: для trial берём 1 ₽ и помечаем описание/ID
    const amountKopecks = trial ? 100 : priced.amount;
    const amountStr = toAmountStringFromKopecks(amountKopecks);
    const order_id  = makeOrderId(vkUserId, tier, plan, trial ? '_trial' : '');
    const baseDesc  = asciiDescription(priced.title || priced.label || 'LiveManager');
    const description = trial ? `${baseDesc} trial 1 day` : baseDesc;

    // Payload для VKWebAppOpenPayForm
    const openPayForm = {
      app_id: VK_APP_ID,
      action: 'pay-to-service',
      params: {
        merchant_id: VK_MERCHANT_ID,  // строка
        amount: amountStr,            // "XXXX.XX"
        order_id,                     // ASCII
        description,                  // ASCII
      },
    };

    return NextResponse.json({ ok: true, openPayForm });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export const GET = POST;
