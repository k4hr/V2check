// app/api/admin/payments/route.ts
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

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23,59,59,999);
  return x;
}

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
    if (!adm.ok) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const url = new URL(req.url);
    const q        = (url.searchParams.get('q') || '').trim();
    const page     = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const limit    = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '30')));
    const tierRaw  = (url.searchParams.get('tier') || '').toUpperCase();
    const planRaw  = (url.searchParams.get('plan') || '').toUpperCase();
    const currency = (url.searchParams.get('currency') || '').toUpperCase();

    const fromStr  = url.searchParams.get('from') || '';
    const toStr    = url.searchParams.get('to')   || '';

    const where: any = {};

    // Поиск по tg id / payload / invoice id
    if (q) {
      where.OR = [
        { telegramId: { contains: q } },
        { payload:    { contains: q } },
        { providerPaymentChargeId: { contains: q } },
      ];
    }

    // Период
    if (fromStr || toStr) {
      where.createdAt = {};
      if (fromStr) where.createdAt.gte = startOfDay(new Date(fromStr));
      if (toStr)   where.createdAt.lte = endOfDay(new Date(toStr));
    }

    // Фильтры
    if (tierRaw === 'PRO' || tierRaw === 'PROPLUS') where.tier = tierRaw as Tier;
    if (planRaw && ['WEEK','MONTH','HALF_YEAR','YEAR'].includes(planRaw)) where.plan = planRaw as Plan;
    if (currency) where.currency = currency;

    const skip = (page - 1) * limit;

    const [items, total, sums, sumsByCurrency] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
        select: {
          id: true,
          createdAt: true,
          telegramId: true,
          tier: true,
          plan: true,
          amount: true,      // в звёздах (у нас унифицировано)
          currency: true,    // 'TON' | 'USDT' | 'CRYPTO' | ...
          days: true,
          providerPaymentChargeId: true,
          payload: true,
        },
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({ where, _sum: { amount: true } }),
      prisma.payment.groupBy({ where, by: ['currency'], _sum: { amount: true } }),
    ]);

    return NextResponse.json({
      ok: true,
      page, limit, total,
      items,
      totals: {
        stars: Number(sums._sum.amount || 0),
        byCurrency: (sumsByCurrency || []).map(x => ({ currency: x.currency || 'CRYPTO', stars: Number(x._sum.amount || 0) })),
      },
      period: { from: fromStr || null, to: toStr || null },
      filters: { q, tier: where.tier || null, plan: where.plan || null, currency: where.currency || null },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
