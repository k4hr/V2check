/* path: app/api/admin/stats/route.ts */
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, getTelegramId, getInitDataFrom } from '@/lib/auth/verifyInitData';

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

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24*60*60*1000);
    const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);

    // Базовые счётчики
    const [
      totalUsers,
      active24h,
      active7d,
      newToday,
      new7d,
      subsActive,
      subsPro,
      subsProPlus,
      subsExpired,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { lastSeenAt: { gte: dayAgo } } }),
      prisma.user.count({ where: { lastSeenAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfDay(now) } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { subscriptionUntil: { gt: now } } }),
      prisma.user.count({ where: { subscriptionUntil: { gt: now }, plan: 'PRO' } }),
      prisma.user.count({ where: { subscriptionUntil: { gt: now }, plan: 'PROPLUS' } }),
      prisma.user.count({ where: { subscriptionUntil: { lte: now, not: null } } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: {
          telegramId: true, username: true, firstName: true, lastName: true,
          plan: true, subscriptionUntil: true, createdAt: true, lastSeenAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      at: now.toISOString(),
      totals: {
        totalUsers, active24h, active7d, newToday, new7d,
        subsActive, subsPro, subsProPlus, subsExpired,
      },
      recent: recentUsers,
    });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
