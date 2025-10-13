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

function resolveTelegramId(req: NextRequest): { ok: boolean; id?: string } {
  const initData = req.headers.get('x-init-data') || req.headers.get('x-tg-init-data') || '';
  const v = initData ? validateHmac(initData) : { ok: false as const };
  if (v.ok && v.userId) return { ok: true, id: v.userId };
  if (DEBUG) {
    try {
      const u = new URL(req.url);
      const id = u.searchParams.get('id');
      if (id && /^\d{3,15}$/.test(id)) return { ok: true, id };
    } catch {}
  }
  return { ok: false };
}

// GET /api/favorites/threads?q=&limit=50
export async function GET(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').trim();
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 50), 1), 200);

    const rows = await prisma.chatThread.findMany({
      where: {
        user: { telegramId: who.id },
        starred: true,
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: limit,
      select: { id: true, title: true, emoji: true, toolSlug: true, updatedAt: true, lastUsedAt: true },
    });

    return NextResponse.json({ ok: true, threads: rows });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}
