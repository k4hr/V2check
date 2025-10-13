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
  if (initData) {
    const v = validateHmac(initData);
    if (v.ok && v.userId) return { ok: true, id: v.userId };
  }
  if (DEBUG) {
    try {
      const u = new URL(req.url);
      const id = u.searchParams.get('id');
      if (id && /^\d{3,15}$/.test(id)) return { ok: true, id };
    } catch {}
  }
  return { ok: false };
}

export async function POST(req: NextRequest) {
  try {
    const who = resolveTelegramId(req);
    if (!who.ok || !who.id) return bad(401, 'AUTH_REQUIRED');

    const body = await req.json().catch(() => ({}));
    const threadId = String(body?.threadId || '').trim();
    if (!threadId) return bad(400, 'THREAD_ID_REQUIRED');

    // проверка владения
    const thr = await prisma.chatThread.findFirst({
      where: { id: threadId, user: { telegramId: who.id } },
      select: { id: true },
    });
    if (!thr) return bad(404, 'THREAD_NOT_FOUND');

    const msgs = Array.isArray(body?.messages) ? body.messages : [];
    if (!msgs.length) return bad(400, 'MESSAGES_REQUIRED');

    const rows = msgs.map((m: any) => ({
      threadId,
      role: String(m?.role || 'assistant'),
      content: String(m?.content || '').slice(0, 20000),
      imagesJson: Array.isArray(m?.images) ? JSON.stringify(m.images.slice(0, 50)) : null,
    }));

    await prisma.$transaction([
      prisma.chatMessage.createMany({ data: rows }),
      prisma.chatThread.update({ where: { id: threadId }, data: { lastUsedAt: new Date() } }),
    ]);

    return NextResponse.json({ ok: true, count: rows.length });
  } catch (e: any) {
    return bad(500, e?.message || 'SERVER_ERROR');
  }
}
