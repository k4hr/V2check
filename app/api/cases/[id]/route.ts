// app/api/cases/[id]/route.ts
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

/** GET /api/cases/[id] — получить дело (без элементов) */
export async function GET(req: NextRequest, ctx: any) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });

    const caseId = String(ctx?.params?.id || '');
    if (!caseId) return NextResponse.json({ ok: false, error: 'NO_CASE_ID' }, { status: 400 });

    const c = await prisma.case.findFirst({
      where: { id: caseId, userId: user.id },
      select: {
        id: true, title: true, status: true,
        createdAt: true, updatedAt: true, nextDueAt: true,
      },
    });
    if (!c) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });

    return NextResponse.json({ ok: true, case: c });
  } catch {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}
