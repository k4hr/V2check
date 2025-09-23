// app/api/cases/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = (globalThis as any).__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).__prisma__ = prisma;

/** helpers */
function getDebugTgId(req: NextRequest): string | null {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id && /^\d{3,15}$/.test(id)) return id;
  } catch {}
  return null;
}
function getTgIdFromInitData(req: NextRequest): string | null {
  const initData = req.headers.get('x-init-data') || '';
  if (!initData) return null;
  try {
    const sp = new URLSearchParams(initData);
    const userStr = sp.get('user');
    if (!userStr) return null;
    const u = JSON.parse(userStr);
    if (u?.id) return String(u.id);
  } catch {}
  return null;
}
async function resolveUser(req: NextRequest) {
  const tgId = getTgIdFromInitData(req) || getDebugTgId(req);
  if (!tgId) return null;
  return prisma.user.upsert({
    where: { telegramId: tgId },
    create: { telegramId: tgId },
    update: {},
  });
}

/** GET /api/cases/[id]/items — список элементов таймлайна */
export async function GET(req: NextRequest, ctx: any) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });

    const caseId = String(ctx?.params?.id || '');
    if (!caseId) return NextResponse.json({ ok: false, error: 'NO_CASE_ID' }, { status: 400 });

    const owner = await prisma.case.findFirst({ where: { id: caseId, userId: user.id }, select: { id: true } });
    if (!owner) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

    const items = await prisma.caseItem.findMany({
      where: { caseId },
      orderBy: [{ createdAt: 'desc' }],
      select: { id: true, kind: true, title: true, body: true, dueAt: true, done: true, priority: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}

/** POST /api/cases/[id]/items — добавить элемент таймлайна */
export async function POST(req: NextRequest, ctx: any) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });

    const caseId = String(ctx?.params?.id || '');
    if (!caseId) return NextResponse.json({ ok: false, error: 'NO_CASE_ID' }, { status: 400 });

    const owner = await prisma.case.findFirst({ where: { id: caseId, userId: user.id }, select: { id: true } });
    if (!owner) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const kind = (body?.kind as string)?.trim() || 'note';
    const title = (body?.title as string)?.trim() || '';
    if (!title) return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 });

    let dueAt: Date | null = null;
    if (body?.dueAt) {
      const d = new Date(body.dueAt);
      if (!isNaN(d.getTime())) dueAt = d;
    }

    const item = await prisma.caseItem.create({
      data: { caseId, kind, title, body: (body?.body as string) || null, dueAt, done: false },
      select: { id: true, kind: true, title: true, body: true, dueAt: true, done: true, priority: true, createdAt: true },
    });

    // Пересчитать ближайший дедлайн
    const nearest = await prisma.caseItem.findFirst({
      where: { caseId, dueAt: { not: null } },
      orderBy: { dueAt: 'asc' },
      select: { dueAt: true },
    });
    await prisma.case.update({ where: { id: caseId }, data: { nextDueAt: nearest?.dueAt ?? null } });

    return NextResponse.json({ ok: true, item });
  } catch {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}
