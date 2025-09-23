// app/api/cases/auto-create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = (globalThis as any).__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).__prisma__ = prisma;

function getDebugTgId(req: NextRequest): string | null {
  try {
    const id = req.nextUrl.searchParams.get('id');
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

async function createOrReuseCase(opts: {
  userId: string;
  title: string;
  answer?: string;
  qa?: { q: string; a: string }[];
  nextDueAt?: Date | null;
}) {
  const { userId, title, answer = '', qa = [], nextDueAt = null } = opts;

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const existing = await prisma.case.findFirst({
    where: { userId, title, createdAt: { gte: twoHoursAgo }, status: 'active' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });

  let caseId: string;
  if (existing) {
    caseId = existing.id;
  } else {
    const created = await prisma.case.create({
      data: { userId, title, status: 'active', nextDueAt: nextDueAt ?? undefined },
      select: { id: true },
    });
    caseId = created.id;

    if (answer) {
      await prisma.caseItem.create({
        data: { caseId, kind: 'note', title: 'Ответ ассистента', body: answer },
      });
    }
    if (qa.length) {
      const items = qa
        .filter((x) => x?.q)
        .map((x) => ({
          caseId,
          kind: 'note' as const,
          title: `Уточнение: ${x.q}`.slice(0, 150),
          body: x.a || '',
        }));
      if (items.length) await prisma.caseItem.createMany({ data: items });
    }
  }

  const nearest = await prisma.caseItem.findFirst({
    where: { caseId, dueAt: { not: null } },
    orderBy: { dueAt: 'asc' },
    select: { dueAt: true },
  });
  await prisma.case.update({
    where: { id: caseId },
    data: { nextDueAt: nearest?.dueAt ?? (nextDueAt ?? null) },
  });

  return caseId;
}

function dbg(e: any, req: NextRequest) {
  const debug = req.nextUrl.searchParams.get('debug') === '1';
  if (!debug) return { ok: false, error: 'INTERNAL' };
  return {
    ok: false,
    error: 'INTERNAL',
    code: e?.code,
    message: e?.message,
    meta: e?.meta,
  };
}

// --- GET: отладка из браузера ---
export async function GET(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const url = req.nextUrl;
    const title = (url.searchParams.get('title') || 'Тестовое дело').trim();
    const answer = url.searchParams.get('answer') || '';
    const dueAtStr = url.searchParams.get('dueAt');
    const dueAt = dueAtStr ? new Date(dueAtStr) : null;

    const caseId = await createOrReuseCase({
      userId: user.id,
      title,
      answer,
      nextDueAt: dueAt && !isNaN(dueAt.getTime()) ? dueAt : null,
    });

    return NextResponse.json({ ok: true, caseId, via: 'GET' });
  } catch (e: any) {
    return NextResponse.json(dbg(e, req), { status: 500 });
  }
}

// --- POST: боевой ---
export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const json = await req.json().catch(() => ({}));
    const { title, qa = [], answer = '', nextDueAt } = json || {};

    const safeTitle = (typeof title === 'string' && title.trim()) ? title.trim() : 'Моё дело';
    let due: Date | null = null;
    if (nextDueAt) {
      const d = new Date(nextDueAt);
      if (!isNaN(d.getTime())) due = d;
    }

    const caseId = await createOrReuseCase({
      userId: user.id,
      title: safeTitle,
      answer: typeof answer === 'string' ? answer : '',
      qa: Array.isArray(qa) ? qa : [],
      nextDueAt: due,
    });

    return NextResponse.json({ ok: true, caseId, via: 'POST' });
  } catch (e: any) {
    return NextResponse.json(dbg(e, req), { status: 500 });
  }
}
