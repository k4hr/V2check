import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const DEBUG = (process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG || '') === '1';

function bad(status: number, error: string, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extra || {}) }, { status });
}

// --- auth utils (та же логика, что в /api/chat-threads) ---
function validateHmac(initData: string): { ok: boolean; userId?: string } {
  try {
    if (!initData || !BOT_TOKEN) return { ok: false };
    const p = new URLSearchParams(initData);
    const hash = p.get('hash') || '';
    p.delete('hash');

    const data = [...p.entries()].map(([k, v]) => `${k}=${v}`).sort().join('\n');
    const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const check = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (check !== hash) return { ok: false };

    const userRaw = p.get('user'); if (!userRaw) return { ok: false };
    const u = JSON.parse(userRaw);
    const id = u?.id ? String(u.id) : null;
    if (!id) return { ok: false };
    return { ok: true, userId: id };
  } catch { return { ok: false }; }
}

function resolveTelegramId(req: NextRequest): { ok: boolean; id?: string; via: 'hmac'|'debug'|'none' } {
  const initData = req.headers.get('x-init-data') || req.headers.get('x-tg-init-data') || '';
  if (initData) {
    const v = validateHmac(initData);
    if (v.ok && v.userId) return { ok: true, id: v.userId, via: 'hmac' };
    return { ok: false, via: 'hmac' };
  }
  if (DEBUG) {
    try {
      const u = new URL(req.url);
      const id = u.searchParams.get('id');
      if (id && /^\d{3,15}$/.test(id)) return { ok: true, id, via: 'debug' };
    } catch {}
  }
  return { ok: false, via: 'none' };
}

async function ensureUser(telegramId: string) {
  return prisma.user.upsert({
    where: { telegramId },
    create: { telegramId },
    update: {},
    select: { id: true, telegramId: true, plan: true, subscriptionUntil: true },
  });
}

function isProPlusActive(u: { plan?: string | null; subscriptionUntil?: Date | null }): boolean {
  const active = !!u.subscriptionUntil && u.subscriptionUntil! > new Date();
  return active && (u.plan || '').toUpperCase() === 'PROPLUS';
}

// --- GET /api/favorites: список избранных тредов Pro+ ---
export async function GET(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const user = await ensureUser(who.id);
    if (!isProPlusActive(user)) {
      return bad(402, 'PROPLUS_REQUIRED');
    }

    // нужен id для debug-режима, чтобы прокинуть его в url
    let debugSuffix = '';
    if (DEBUG) {
      try {
        const u = new URL(req.url);
        const dbg = u.searchParams.get('id');
        if (dbg && /^\d{3,15}$/.test(dbg)) debugSuffix = `&id=${encodeURIComponent(dbg)}`;
      } catch {}
    }

    const threads = await prisma.chatThread.findMany({
      where: { userId: user.id, starred: true },
      orderBy: [{ updatedAt: 'desc' }],
      select: { id: true, title: true, updatedAt: true, createdAt: true },
    });

    const items = threads.map(t => ({
      id: t.id,
      title: t.title || 'Без названия',
      url: `/home/ChatGPT?thread=${encodeURIComponent(t.id)}${debugSuffix ? debugSuffix : ''}`,
      note: null as string | null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}

// совместимость
export const POST = GET;
