import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = globalThis.__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).__prisma__ = prisma;

/** debug-помощник: ?id=123456 (как в /api/me) */
function getDebugTgId(req: NextRequest): string | null {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id && /^\d{3,15}$/.test(id)) return id;
  } catch {}
  return null;
}

/** Достаём юзера по telegramId. Для прода у тебя уже есть в /api/me нормальная верификация. */
async function getUserByRequest(req: NextRequest) {
  const tgId = getDebugTgId(req);
  if (!tgId) return null;
  return prisma.user.findUnique({ where: { telegramId: tgId } });
}

/** GET /api/cases/[id]/items — список айтемов дела (только владельцу) */
export async function GET(req: NextRequest, ctx: any) {
  try {
    const user = await getUserByRequest(req);
    if (!user) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const caseId = ctx?.params?.id as string | undefined;
    if (!caseId) return NextResponse.json({ ok: false, error: 'NO_CASE_ID' }, { status: 400 });

    const legalCase = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true, userId: true } });
    if (!legalCase) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    if (legalCase.userId !== user.id) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

    const items = await prisma.caseItem.findMany({
      where: { caseId },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}

/** POST /api/cases/[id]/items — добавить айтем (note/step/deadline/doc) */
export async function POST(req: NextRequest, ctx: any) {
  try {
    const user = await getUserByRequest(req);
    if (!user) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const caseId = ctx?.params?.id as string | undefined;
    if (!caseId) return NextResponse.json({ ok: false, error: 'NO_CASE_ID' }, { status: 400 });

    const legalCase = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true, userId: true } });
    if (!legalCase) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    if (legalCase.userId !== user.id) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

    const bodyJson = await req.json().catch(() => ({}));
    const {
      kind = 'note',
      title = 'Без названия',
      body = '',
      dueAt,
      done = false,
      priority,
    } = bodyJson || {};

    // мягкая валидация
    const safeKind = typeof kind === 'string' ? kind : 'note';
    const safeTitle = typeof title === 'string' && title.trim() ? title.trim() : 'Без названия';
    const safeBody = typeof body === 'string' ? body : '';
    const safeDone = Boolean(done);
    const safePriority = typeof priority === 'number' ? priority : null;

    let safeDueAt: Date | null = null;
    if (dueAt) {
      const d = new Date(dueAt);
      if (!isNaN(d.getTime())) safeDueAt = d;
    }

    const item = await prisma.caseItem.create({
      data: {
        caseId,
        kind: safeKind,
        title: safeTitle,
        body: safeBody,
        dueAt: safeDueAt || undefined,
        done: safeDone,
        priority: safePriority ?? undefined,
      },
    });

    // Обновим nextDueAt у дела, если добавили дедлайн ближе текущего
    if (safeDueAt) {
      // вычислим ближайший dueAt по всем айтемам
      const next = await prisma.caseItem.findFirst({
        where: { caseId, dueAt: { not: null } },
        orderBy: { dueAt: 'asc' },
        select: { dueAt: true },
      });
      await prisma.case.update({
        where: { id: caseId },
        data: { nextDueAt: next?.dueAt ?? null },
      });
    }

    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}
