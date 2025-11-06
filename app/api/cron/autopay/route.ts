/* path: app/api/cron/autopay/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getVkRubKopecksOne, resolveTier, resolvePlan, type Tier, type Plan } from '@/lib/pricing';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

const SHOP_ID     = process.env.YK_SHOP_ID || '';
const SECRET_KEY  = process.env.YK_SECRET_KEY || '';
const CRON_SECRET = (process.env.CRON_SECRET || '').trim();
const RECEIPT_FALLBACK_EMAIL = (process.env.RECEIPT_FALLBACK_EMAIL || 'no-reply@livemanager.app').trim();

const fmt = (k:number)=> (k/100).toFixed(2);
const sha256 = (s:string)=> crypto.createHash('sha256').update(s).digest('hex');

function addDays(date: Date, days: number) { const d = new Date(date); d.setUTCDate(d.getUTCDate() + days); return d; }
function daysFor(plan: Plan): number {
  switch (plan) {
    case 'WEEK': return 7;
    case 'MONTH': return 30;
    case 'HALF_YEAR': return 183;
    case 'YEAR': return 365;
  }
}

export async function POST(req: Request) {
  try {
    if (!CRON_SECRET) return NextResponse.json({ ok:false, error:'CRON_SECRET not set' }, { status:500 });
    const got = (req.headers.get('x-cron-secret') || '').trim();
    if (got !== CRON_SECRET) return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });

    if (!SHOP_ID || !SECRET_KEY) return NextResponse.json({ ok:false, error:'YKassa env not set' }, { status:500 });

    const url = new URL(req.url);
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || '20')));

    const now = new Date();
    const due = await prisma.user.findMany({
      where: {
        autopayActive: true,
        autopayNextAt: { lte: now },
        ykPaymentMethodId: { not: null },
      },
      take: limit,
      orderBy: { autopayNextAt: 'asc' },
      select: { id:true, telegramId:true, plan:true, ykPaymentMethodId:true, ykCustomerId:true, autopayTier:true, autopayPlan:true, subscriptionUntil:true },
    });

    const auth = Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString('base64');

    let ok = 0, fail = 0;
    const results: any[] = [];

    for (const u of due) {
      try {
        const tier: Tier = resolveTier(u.autopayTier || u.plan || 'PRO');
        const plan: Plan = resolvePlan(u.autopayPlan || 'MONTH');

        const amountK = getVkRubKopecksOne(tier, plan);
        const description = `LiveManager ${tier} — автопродление ${plan}`;
        const metadata: Record<string, any> = { tier, plan, telegramId: u.telegramId, recur: '1' };

        // Достаём email для чека из последнего успешного платежа
        let email: string | undefined;
        try {
          const cp = await prisma.cardPayment.findFirst({
            where: { telegramId: u.telegramId || undefined },
            orderBy: { createdAt: 'desc' },
            select: { meta: true },
          });
          const meta: any = cp?.meta || {};
          email =
            meta?.receipt?.customer?.email ||
            meta?.metadata?.email ||
            undefined;
        } catch {}

        if (!email) email = RECEIPT_FALLBACK_EMAIL;

        const receipt = {
          customer: { email },
          items: [{
            description,
            quantity: '1.00',
            amount: { value: fmt(amountK), currency: 'RUB' },
            vat_code: 1,
            payment_mode: 'full_prepayment',
            payment_subject: 'service',
          }],
        };

        const idempotenceKey = sha256(`${u.id}:${plan}:${Math.floor(Date.now()/3600000)}`).slice(0,48);

        const payload: any = {
          amount: { value: fmt(amountK), currency: 'RUB' },
          capture: true,
          payment_method_id: u.ykPaymentMethodId!,
          description,
          metadata,
          receipt, // <— ОБЯЗАТЕЛЬНО для 54-ФЗ
          ...(u.ykCustomerId ? { customer: { id: u.ykCustomerId } } : {}),
        };

        const resp = await fetch('https://api.yookassa.ru/v3/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Idempotence-Key': idempotenceKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();

        if (!resp.ok || data?.status !== 'succeeded') {
          fail++;
          results.push({ user: u.telegramId, error: data?.description || 'create_failed', status: data?.status });
          await prisma.user.update({ where: { id: u.id }, data: { autopayNextAt: addDays(now, 1) } });
          continue;
        }

        const add = daysFor(plan);
        const from = (u.subscriptionUntil && u.subscriptionUntil > now) ? u.subscriptionUntil : now;
        const until = addDays(from, add);

        await prisma.user.update({
          where: { id: u.id },
          data: { subscriptionUntil: until, plan: tier, autopayNextAt: addDays(now, add) },
        });

        const amountStr = String(data?.amount?.value || '0');
        const kopecks = Math.round(Number(amountStr) * 100);

        await prisma.cardPayment.create({
          data: {
            paymentId: data.id,
            telegramId: u.telegramId || undefined,
            tier, plan,
            amountKopecks: kopecks,
            paymentMethodId: u.ykPaymentMethodId || undefined,
            customerId: u.ykCustomerId || undefined,
            isTrial: false,
            meta: data,
          },
        });
        await prisma.payment.create({
          data: {
            userId: u.id,
            telegramId: u.telegramId || '',
            payload: `yk:auto:${tier}:${plan}`,
            tier, plan,
            amount: kopecks,
            currency: 'RUB',
            days: add,
            platform: 'WEB',
            provider: 'YKASSA',
            providerPaymentChargeId: data.id,
            raw: { id: data.id, status: data.status, metadata: data.metadata },
          },
        });

        ok++;
        results.push({ user: u.telegramId, ok: true, paymentId: data.id, until });
      } catch (e:any) {
        fail++;
        results.push({ user: u.telegramId, error: String(e?.message||e) });
        await prisma.user.update({ where: { id: u.id }, data: { autopayNextAt: addDays(now, 1) } });
      }
    }

    return NextResponse.json({ ok:true, processed: due.length, success: ok, failed: fail, results });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message||e) }, { status:500 });
  }
}

export const GET = POST;
