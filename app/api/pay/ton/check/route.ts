/* path: app/api/pay/ton/check/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPrices, resolvePlan, resolveTier, type Plan, type Tier } from '@/lib/pricing';
import {
  TON_ADDRESS, fetchIncomingTx, txAmountTon, txComment, txTimeSec,
  isAmountOk, starsToTon, payloadFor, LOOKBACK_MIN
} from '@/lib/ton';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getTgId(req: NextRequest) {
  const hdr = req.headers.get('x-init-data') || req.headers.get('x-tg-init-data') || '';
  try {
    const p = new URLSearchParams(hdr);
    const raw = p.get('user');
    if (raw) { const u = JSON.parse(raw); if (u?.id) return String(u.id); }
  } catch {}
  const id = (new URL(req.url)).searchParams.get('id');
  return id && /^\d{3,15}$/.test(id) ? id : '';
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export async function POST(req: NextRequest) {
  try {
    let body:any=null; try{ body = await req.json(); }catch{}
    const url = new URL(req.url);

    const tier: Tier = resolveTier(body?.tier || url.searchParams.get('tier') || 'PRO');
    const plan: Plan = resolvePlan(body?.plan || url.searchParams.get('plan') || 'MONTH');
    const prices = getPrices(tier);
    const needStars = prices[plan].stars;
    const needTon   = starsToTon(needStars);

    const tgId = getTgId(req) || undefined;
    const expectedPayload = payloadFor(tier, plan, tgId);

    // 1) получаем последние транзакции адреса
    const txs = await fetchIncomingTx(TON_ADDRESS);

    const nowSec = Math.floor(Date.now()/1000);
    const minTs  = nowSec - LOOKBACK_MIN * 60;

    // 2) ищем входящий платёж с нужным комментом и суммой
    const match = txs.find(tx => {
      const when = txTimeSec(tx);
      if (!when || when < minTs) return false;

      const comment = txComment(tx);
      if (comment !== expectedPayload) return false;

      const amt = txAmountTon(tx);
      return isAmountOk(amt, needTon);
    });

    if (!match) {
      return NextResponse.json({ ok:false, error:'NOT_FOUND', hint:'Платёж не найден. Проверьте, что в комментарии к переводу указан корректный код и сумма не меньше требуемой.' }, { status: 404 });
    }

    const hash = String(match?.hash || '');
    const amtTon = txAmountTon(match);

    // идемпотентность по tx hash
    const exists = await prisma.payment.findFirst({
      where: { providerPaymentChargeId: hash },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ ok:true, stage:'already_processed' });
    }

    // находим/создаём пользователя по tgId
    const user = await prisma.user.upsert({
      where: { telegramId: String(tgId || `ton-${hash}`) },
      create: { telegramId: String(tgId || `ton-${hash}`), plan: tier },
      update: { plan: tier },
      select: { id:true, subscriptionUntil:true },
    });

    const days = prices[plan].days;
    const now  = new Date();
    const from = user.subscriptionUntil && user.subscriptionUntil > now ? user.subscriptionUntil : now;
    const until = addDays(from, days);

    // лог платежа
    await prisma.payment.create({
      data: {
        userId: user.id,
        telegramId: String(tgId || ''),
        payload: expectedPayload,
        tier, plan,
        amount: needStars,               // в «звёздах» для унификации
        currency: 'TON',
        days,
        providerPaymentChargeId: hash,   // tx hash
        meta: { amtTon, address: TON_ADDRESS },
      } as any,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionUntil: until, plan: tier },
    });

    return NextResponse.json({
      ok: true,
      stage: 'subscription_extended',
      tier, plan, until,
      tx: { hash, amountTon: amtTon, ts: match?.utime ?? null },
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
