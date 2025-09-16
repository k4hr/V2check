// app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function hmacIsValid(initData: string, botToken: string) {
  try {
    if (!initData || !botToken) return { valid: false, reason: 'empty' };
    const url = new URLSearchParams(initData);
    const hash = url.get('hash') || '';
    url.delete('hash');

    const data = [...url.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const check = crypto.createHmac('sha256', secret).update(data).digest('hex');

    return { valid: check === hash, hash, check };
  } catch (e: any) {
    return { valid: false, reason: e?.message || 'hmac error' };
  }
}

function extractUserIdFromInitData(initData: string): string | null {
  try {
    const p = new URLSearchParams(initData);
    const unsafe = JSON.parse(p.get('user') || 'null');
    const id = unsafe?.id ? String(unsafe.id) : null;
    return id;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const initData = req.headers.get('x-init-data') || '';
    let userId: string | null = null;
    let via: 'initData' | 'debugId' | 'none' = 'none';

    // 1) Нормальный путь через initData
    if (initData) {
      const h = hmacIsValid(initData, BOT_TOKEN);
      if (!h.valid) {
        return NextResponse.json({ ok:false, error:'BAD_INITDATA', why: h.reason || 'invalid_hmac' }, { status: 401 });
      }
      userId = extractUserIdFromInitData(initData);
      if (!userId) return NextResponse.json({ ok:false, error:'NO_USER_IN_INITDATA' }, { status: 400 });
      via = 'initData';
    }

    // 2) Браузерный дебаг (без Telegram)
    if (!userId && ALLOW_BROWSER_DEBUG) {
      const debugId = url.searchParams.get('id');
      if (debugId && /^\d{3,15}$/.test(debugId)) {
        userId = debugId;
        via = 'debugId';
      }
    }

    if (!userId) {
      return NextResponse.json({
        ok:false,
        error:'AUTH_REQUIRED',
        hint: ALLOW_BROWSER_DEBUG
          ? 'Pass ?id=<TELEGRAM_ID> in query for debug mode'
          : 'Open from Telegram Mini App so initData is present'
      }, { status: 401 });
    }

    // 3) Достаём подписку
    const u = await prisma.user.findFirst({ where: { telegramId: String(userId) } });
    const now = new Date();
    const active = !!(u?.subscriptionUntil && u.subscriptionUntil > now);

    return NextResponse.json({
      ok: true,
      user: { telegramId: String(userId) },
      subscription: {
        active,
        expiresAt: u?.subscriptionUntil || null
      },
      via
    });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// для удобства можно дернуть GET (в браузере)
export const GET = POST;
