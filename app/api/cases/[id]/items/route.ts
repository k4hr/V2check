// app/api/cases/[id]/items/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

async function requireUser(req: NextRequest) {
  const initData = req.headers.get('x-init-data') || '';
  let userTgId: string | null = null;

  if (initData) {
    const h = hmacIsValid(initData, BOT_TOKEN);
    if (!h.valid) {
      return NextResponse.json({ ok:false, error:'BAD_INITDATA', why: h.reason || 'invalid_hmac' }, { status: 401 });
    }
    userTgId = extractUserIdFromInitData(initData);
  }
  if (!userTgId && ALLOW_BROWSER_DEBUG) {
    const debugId = new URL(req.url).searchParams.get('id');
    if (debugId && /^\d{3,15}$/.test(debugId)) userTgId = debugId;
  }
  if (!userTgId) {
    return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status: 401 });
  }

  let user = await prisma.user.findFirst({ where: { telegramId: String(userTgId) } });
  if (!user) {
    user = await prisma.user.create({ data: { telegramId: String(userTgId) } });
  }
  return user;
}

// GET /api/cases/[id]/items — получить элементы дела
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const userOrResp = await requireUser(req);
  if ('ok' in (userOrResp as any) && (userOrResp as any).ok === false) return userOrResp as NextResponse;
  const user = userOrResp as any;

  const id = params.id;
  const c = await prisma.case.findFirst({
    where: { id, userId: user.id },
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });
  if (!c) return NextResponse.json({ ok:false, error:'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ ok:true, items: c.items });
}

// POST /api/cases/[id]/items — добавить элемент
// body: { kind: 'note'|'step'|'deadline'|'doc', title: string, body?: string, dueAt?: string, priority?: number }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const userOrResp = await requireUser(req);
  if ('ok' in (userOrResp as any) && (userOrResp as any).ok === false) return userOrResp as NextResponse;
  const user = userOrResp as any;

  const id = params.id;
  const c = await prisma.case.findFirst({ where: { id, userId: user.id } });
  if (!c) return NextResponse.json({ ok:false, error:'NOT_FOUND' }, { status: 404 });

  try {
    const body = await req.json();
    const kind = String(body?.kind || 'note');
    const title = String(body?.title || '').trim();
    const text = body?.body ? String(body.body) : undefined;
    const dueAt = body?.dueAt ? new Date(String(body.dueAt)) : undefined;
    const priority = typeof body?.priority === 'number' ? body.priority : undefined;

    if (!title) return NextResponse.json({ ok:false, error:'TITLE_REQUIRED' }, { status: 400 });

    const created = await prisma.caseItem.create({
      data: { caseId: id, kind, title, body: text, dueAt, priority },
    });

    // подтянем nextDueAt на дело, если надо
    if (dueAt) {
      const next = await prisma.caseItem.findFirst({
        where: { caseId: id, dueAt: { not: null }, done: false },
        orderBy: { dueAt: 'asc' },
        select: { dueAt: true },
      });
      await prisma.case.update({
        where: { id },
        data: { nextDueAt: next?.dueAt || null },
      });
    }

    return NextResponse.json({ ok:true, itemId: created.id });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
