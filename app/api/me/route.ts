import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  verifyInitData,
  getInitDataFrom,
  getTelegramIdStrict,
} from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function extractUnsafeUser(initData: string): {
  id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
} | null {
  try {
    const p = new URLSearchParams(initData);
    const raw = p.get('user');
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const initData = getInitDataFrom(req);
    const url = new URL(req.url);

    let telegramId = '';
    let via: 'initData' | 'debugId' | 'none' = 'none';

    if (initData) {
      if (!BOT_TOKEN || !verifyInitData(initData, BOT_TOKEN)) {
        return NextResponse.json({ ok: false, error: 'BAD_INITDATA' }, { status: 401 });
      }
      telegramId = getTelegramIdStrict(initData);
      via = 'initData';
    }

    if (!telegramId && ALLOW_BROWSER_DEBUG) {
      const id = url.searchParams.get('id') || '';
      if (/^\d{3,15}$/.test(id)) {
        telegramId = id;
        via = 'debugId';
      }
    }

    if (!telegramId) {
      return NextResponse.json({
        ok: false,
        error: 'AUTH_REQUIRED',
        hint: ALLOW_BROWSER_DEBUG
          ? 'Pass ?id=<TELEGRAM_ID> for debug mode'
          : 'Open from Telegram Mini App so initData is present',
      }, { status: 401 });
    }

    // ---- upsert user + lastSeenAt ----
    const uUnsafe = initData ? extractUnsafeUser(initData) : null;
    const now = new Date();

    const user = await prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: uUnsafe?.username || null,
        firstName: uUnsafe?.first_name || null,
        lastName: uUnsafe?.last_name || null,
        lastSeenAt: now,
      },
      update: {
        username: uUnsafe?.username ?? undefined,
        firstName: uUnsafe?.first_name ?? undefined,
        lastName: uUnsafe?.last_name ?? undefined,
        lastSeenAt: now,
      },
      select: {
        id: true,
        telegramId: true,
        subscriptionUntil: true,
        plan: true,
      },
    });

    const active = !!(user.subscriptionUntil && user.subscriptionUntil > now);

    return NextResponse.json({
      ok: true,
      user: { telegramId: user.telegramId },
      subscription: {
        active,
        expiresAt: user.subscriptionUntil || null,
        plan: user.plan || null,
      },
      via,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// Для удобства — GET зеркалит POST
export const GET = POST;
