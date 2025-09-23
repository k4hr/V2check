// app/api/cases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = (globalThis as any).__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).__prisma__ = prisma;

/** --- helpers --------------------------------------------------- */
function getDebugTgId(req: NextRequest): string | null {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id && /^\d{3,15}$/.test(id)) return id;
  } catch {}
  return null;
}

function getTgIdFromInitData(req: NextRequest): string | null {
  // «Мягкий» разбор initData без проверки подписи, как в /api/me и /api/cases/auto-create
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

/** --- GET /api/cases (список дел) ------------------------------- */
export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });

    const items = await prisma.case.findMany({
      where: { userId: user.id },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        nextDueAt: true,
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}

/** --- POST /api/cases (создать дело) ---------------------------- */
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'AUTH_REQUIRED' }, { status: 401 });

    const json = await req.json().catch(() => ({}));
    const titleRaw = typeof json?.title === 'string' ? json.title : '';
    const title = titleRaw.trim() || 'Моё дело';

    const c = await prisma.case.create({
      data: { userId: user.id, title, status: 'active' },
      select: { id: true, title: true, status: true, createdAt: true, nextDueAt: true },
    });

    return NextResponse.json({ ok: true, case: c });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}
