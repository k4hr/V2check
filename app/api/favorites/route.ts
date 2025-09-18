// app/api/favorites/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const DEBUG = (process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG || '') === '1';

type SafeUser = { id: string; telegramId: string };

function bad(status: number, error: string, hint?: string) {
  return NextResponse.json({ ok: false, error, ...(hint ? { hint } : {}) }, { status });
}

function validateHmac(initData: string): { ok: boolean; userId?: string } {
  try {
    if (!initData || !BOT_TOKEN) return { ok: false };
    const p = new URLSearchParams(initData);
    const hash = p.get('hash') || '';
    p.delete('hash');

    const data = [...p.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const check = crypto.createHmac('sha256', secret).update(data).digest('hex');
    if (check !== hash) return { ok: false };

    const userRaw = p.get('user');
    if (!userRaw) return { ok: false };
    const u = JSON.parse(userRaw);
    const id = u?.id ? String(u.id) : null;
    if (!id) return { ok: false };
    return { ok: true, userId: id };
  } catch {
    return { ok: false };
  }
}

function resolveTelegramId(req: NextRequest): { ok: boolean; id?: string; via: 'hmac'|'debug'|'none' } {
  const initData = req.headers.get('x-init-data') || '';
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

async function ensureUser(telegramId: string): Promise<SafeUser> {
  const u = await prisma.user.upsert({
    where: { telegramId },
    create: { telegramId },
    update: {},
    select: { id: true, telegramId: true },
  });
  return u;
}

function sanitize(s: unknown): string {
  return String(s || '').trim();
}

function isValidUrl(u?: string | null): boolean {
  if (!u) return true; // url опционален
  try {
    const x = new URL(u);
    return x.protocol === 'http:' || x.protocol === 'https:';
  } catch { return false; }
}

function cap(s: string, n: number) {
  return s.length > n ? s.slice(0, n) : s;
}

export async function GET(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) {
      return bad(401, 'AUTH_REQUIRED', DEBUG ? 'pass ?id=<TELEGRAM_ID> in debug mode' : 'Use Telegram Mini App');
    }
    const user = await ensureUser(who.id);

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { id: true, title: true, url: true, note: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}

export async function POST(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const user = await ensureUser(who.id);

    // Тело запроса
    const body = await req.json().catch(() => ({}));
    let title = sanitize(body.title);
    let url = sanitize(body.url);
    let note = sanitize(body.note);

    // Валидация
    if (!title) return bad(400, 'TITLE_REQUIRED');
    if (title.length < 1 || title.length > 120) return bad(400, 'TITLE_LENGTH_1_120');
    if (url && !isValidUrl(url)) return bad(400, 'BAD_URL');
    title = cap(title, 120);
    url = cap(url, 500);
    note = cap(note, 500);

    // Идемпотентность: не плодим дубли по (userId,title,url)
    const existing = await prisma.favorite.findFirst({
      where: { userId: user.id, title, url: url || null },
      select: { id: true },
    });

    let item;
    if (existing) {
      item = await prisma.favorite.update({
        where: { id: existing.id },
        data: { note, updatedAt: new Date() },
        select: { id: true, title: true, url: true, note: true, createdAt: true, updatedAt: true },
      });
    } else {
      item = await prisma.favorite.create({
        data: { userId: user.id, title, url: url || null, note: note || null },
        select: { id: true, title: true, url: true, note: true, createdAt: true, updatedAt: true },
      });
    }

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const user = await ensureUser(who.id);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id || id.length < 5) return bad(400, 'BAD_ID');

    // Удаляем только свою запись
    const victim = await prisma.favorite.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!victim) return bad(404, 'NOT_FOUND');

    await prisma.favorite.delete({ where: { id } });
    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}
