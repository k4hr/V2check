import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getTelegramId, getInitDataFrom } from '@/lib/auth/verifyInitData';
import type { Plan, Tier } from '@/lib/pricing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function getCookieFromHeader(headers: Headers, name: string): string {
  try {
    const raw = headers.get('cookie') || '';
    const parts = raw.split(/;\s*/);
    for (const p of parts) {
      const [k, ...v] = p.split('=');
      if (decodeURIComponent(k) === name) return decodeURIComponent(v.join('='));
    }
  } catch {}
  return '';
}

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23,59,59,999); return x; }

async function ensureAdmin(req: NextRequest) {
  const url = new URL(req.url);

  // initData: заголовок -> cookie -> ?initData
  let initData = getInitDataFrom(req as any) || '';
  if (!initData) initData = getCookieFromHeader(req.headers, 'tg_init_data') || '';
  if (!initData) initData = url.searchParams.get('initData') || '';

  if (initData) {
    const ok = verifyInitData(initData, BOT_TOKEN);
    if (ok) {
      const id = getTelegramId(initData);
      if (id && ADMIN_TG_IDS.includes(String(id))) return { ok: true, id: String(id), via: 'initData' as const };
      return { ok: false as const, id: id || null, via: 'initData' as const };
    }
  }

  // Debug по ?id (если разрешён)
  if (ALLOW_BROWSER_DEBUG) {
    const debugId = url.searchParams.get('id');
    if (debugId && /^\d{3,15}$/.test(debugId) && ADMIN_TG_IDS.includes(debugId)) {
      return { ok: true as const, id: debugId, via: 'debugId' as const };
    }
  }

  return { ok: false as const, id: null, via: 'none' as const };
}

export async function GET(req: NextRequest) {
  try {
    const adm = await ensureAdmin(req);
    if (!adm.ok) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

    const url = new URL(req.url);
    const q        = (url.searchParams.get('q') || '').trim();
    const page     = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const limit    = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || '30')));

    const tierRaw  = (url.searchParams.get('tier') || '').toUpperCase();
    const planRaw  = (url.searchParams.get('plan') || '').toUpperCase();
    const currency = (url.searchParams.get('currency') || '').toUpperCase(); // только для Stars, оставили совместимость
    const source   = (url.searchParams.get('source') || 'all') as 'all'|'stars'|'card';

    const fromStr  = url.searchParams.get('from') || '';
    const toStr    = url.searchParams.get('to')   || '';

    const from = fromStr ? startOfDay(new Date(fromStr)) : null;
    const to   = toStr   ? endOfDay(new Date(toStr))     : null;

    // -------- where для Stars --------
    const starsWhere: any = {};
    if (q) starsWhere.OR = [
      { telegramId: { contains: q } },
      { payload: { contains: q } },
      { providerPaymentChargeId: { contains: q } },
    ];
    if (from || to) starsWhere.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
    if (tierRaw === 'PRO' || tierRaw === 'PROPLUS') starsWhere.tier = tierRaw as Tier;
    if (planRaw && ['WEEK','MONTH','HALF_YEAR','YEAR'].includes(planRaw)) starsWhere.plan = planRaw as Plan;
    if (currency) starsWhere.currency = currency;

    // -------- where для RUB (CardPayment) --------
    const cardWhere: any = {};
    if (q) cardWhere.OR = [
      { telegramId: { contains: q } },
      { paymentId: { contains: q } },
    ];
    if (from || to) cardWhere.createdAt = { ...(from && { gte: from }), ...(to && { lte: to }) };
    if (tierRaw === 'PRO' || tierRaw === 'PROPLUS') cardWhere.tier = tierRaw as Tier;
    if (planRaw && ['WEEK','MONTH','HALF_YEAR','YEAR'].includes(planRaw)) cardWhere.plan = planRaw as Plan;

    const needStars = source === 'all' || source === 'stars';
    const needCard  = source === 'all' || source === 'card';

    const [
      starsList, starsCount, starsSum, starsByCurrency,
      cardList, cardCount
    ] = await Promise.all([
      needStars ? prisma.payment.findMany({
        where: starsWhere,
        orderBy: { createdAt: 'desc' },
      }) : Promise.resolve([]),
      needStars ? prisma.payment.count({ where: starsWhere }) : Promise.resolve(0),
      needStars ? prisma.payment.aggregate({ where: starsWhere, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: 0 }}),
      needStars ? prisma.payment.groupBy({ where: starsWhere, by:['currency'], _sum:{ amount:true } }) : Promise.resolve([] as any[]),

      needCard ? prisma.cardPayment.findMany({
        where: cardWhere,
        orderBy: { createdAt: 'desc' },
      }) : Promise.resolve([]),
      needCard ? prisma.cardPayment.count({ where: cardWhere }) : Promise.resolve(0),
    ]);

    // нормализуем к единому формату
    const normalized = [
      ...starsList.map((p: any) => ({
        id: `stars:${p.id}`,
        createdAt: p.createdAt as Date,
        telegramId: p.telegramId || null,
        tier: p.tier as Tier,
        plan: p.plan as Plan,
        amountStars: Number(p.amount) || 0,
        amountKopecks: undefined,
        currency: p.currency || 'CRYPTO',
        days: p.days || null,
        providerPaymentChargeId: p.providerPaymentChargeId || null,
        payload: p.payload || null,
        source: 'stars' as const,
      })),
      ...cardList.map((p: any) => ({
        id: `card:${p.id}`,
        createdAt: p.createdAt as Date,
        telegramId: p.telegramId || null,
        tier: p.tier as Tier,
        plan: p.plan as Plan,
        amountStars: undefined,
        amountKopecks: Number(p.amountKopecks) || 0,
        currency: 'RUB',
        days: null,
        providerPaymentChargeId: p.paymentId || null,
        payload: null,
        source: 'card' as const,
      })),
    ].sort((a,b)=> +new Date(b.createdAt) - +new Date(a.createdAt));

    const total = starsCount + cardCount;
    const start = (page - 1) * limit;
    const items = normalized.slice(start, start + limit).map(x => ({
      ...x,
      createdAt: new Date(x.createdAt).toISOString(),
    }));

    const totals = {
      stars: Number((starsSum as any)?._sum?.amount || 0),
      byCurrency: (starsByCurrency as any[]).map(x => ({
        currency: x.currency || 'CRYPTO',
        stars: Number(x._sum?.amount || 0),
      }))
      // ₽ в «звёздах» не суммируем — это отдельная касса
    };

    return NextResponse.json({
      ok: true,
      page, limit, total,
      items,
      totals,
      period: { from: fromStr || null, to: toStr || null },
      filters: {
        q,
        tier: starsWhere.tier || cardWhere.tier || null,
        plan: starsWhere.plan || cardWhere.plan || null,
        currency: currency || null,
        source,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
