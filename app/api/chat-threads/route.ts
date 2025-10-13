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

// GET  /api/chat-threads?id=THREAD_ID
export async function GET(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const u = await ensureUser(who.id);
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || '';
    if (!id) return bad(400, 'ID_REQUIRED');

    const thr = await prisma.chatThread.findFirst({
      where: { id, userId: u.id },
      select: { id: true, toolSlug: true, title: true, emoji: true, starred: true, lastUsedAt: true, updatedAt: true },
    });
    if (!thr) return bad(404, 'NOT_FOUND');

    const msgs = await prisma.chatMessage.findMany({
      where: { threadId: thr.id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true, imagesJson: true, createdAt: true },
    });

    const messages = msgs.map(m => ({
      role: m.role as 'system'|'user'|'assistant',
      content: m.content,
      images: m.imagesJson ? JSON.parse(m.imagesJson) : undefined,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ ok: true, thread: thr, messages });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}

// POST /api/chat-threads  { toolSlug, title, emoji?, starred? }
export async function POST(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const u = await ensureUser(who.id);
    const body = await req.json().catch(() => ({}));
    const toolSlug = String(body?.toolSlug || '').trim();
    const title    = String(body?.title || '').trim();
    const emoji    = String(body?.emoji || '').trim() || null;
    const starred  = !!body?.starred;

    if (!toolSlug || !title) return bad(400, 'TOOLSLUG_AND_TITLE_REQUIRED');
    if (starred && !isProPlusActive(u)) return bad(402, 'PRO_PLUS_REQUIRED');

    const thread = await prisma.chatThread.create({
      data: { userId: u.id, toolSlug, title, emoji, starred },
      select: { id: true, toolSlug: true, title: true, emoji: true, starred: true, lastUsedAt: true },
    });

    return NextResponse.json({ ok: true, thread });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}

// PATCH /api/chat-threads  { id, starred }
export async function PATCH(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const u = await ensureUser(who.id);
    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || '').trim();
    const starred = !!body?.starred;
    if (!id) return bad(400, 'ID_REQUIRED');

    const thr = await prisma.chatThread.findFirst({ where: { id, userId: u.id } });
    if (!thr) return bad(404, 'NOT_FOUND');
    if (starred && !isProPlusActive(u)) return bad(402, 'PRO_PLUS_REQUIRED');

    const updated = await prisma.chatThread.update({
      where: { id },
      data: { starred, lastUsedAt: new Date() },
      select: { id: true, starred: true },
    });

    return NextResponse.json({ ok: true, thread: updated });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}
