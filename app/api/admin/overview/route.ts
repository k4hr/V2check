import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyInitData,
  getInitDataFrom,
  getTelegramId,
} from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function isAdminId(id: string) { return !!id && ADMIN_TG_IDS.includes(id); }

export async function GET(req: NextRequest) {
  try {
    // --- авторизация администратора ---
    const initData = getInitDataFrom(req);
    let id = '';
    if (initData) {
      if (!BOT_TOKEN || !verifyInitData(initData, BOT_TOKEN)) {
        return NextResponse.json({ ok:false, error:'BAD_INITDATA' }, { status:401 });
      }
      id = getTelegramId(initData) || '';
    }
    if (!id && ALLOW_BROWSER_DEBUG) {
      const u = new URL(req.url);
      const qid = u.searchParams.get('id') || '';
      if (/^\d{3,15}$/.test(qid)) id = qid;
    }
    if (!isAdminId(id)) return NextResponse.json({ ok:false, error:'ACCESS_DENIED' }, { status:403 });

    // --- данные сводки ---
    const [users, activeSubs, pro, proplus, payments] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { subscriptionUntil: { gt: new Date() } } }),
      prisma.user.count({ where: { plan: 'PRO' } }),
      prisma.user.count({ where: { plan: 'PROPLUS' } }),
      prisma.payment.count(),
    ]);

    const latestUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        telegramId: true, username: true, plan: true, subscriptionUntil: true, lastSeenAt: true, createdAt: true,
      },
    });

    const latestPayments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        telegramId: true, tier: true, plan: true, amount: true, currency: true, days: true, createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      totals: { users, activeSubs, pro, proplus, payments },
      latestUsers,
      latestPayments,
    });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}
