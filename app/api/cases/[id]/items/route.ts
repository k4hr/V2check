// app/api/cases/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeDate(input: any): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}
function safeStr(input: any, max = 200): string | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  return s ? s.slice(0, max) : null;
}
const ALLOWED_STATUS = new Set(['active', 'closed', 'archived']);

/** Получить дело + его элементы (сортировка по сроку/созданию) */
export async function GET(_req: Request, ctx: any) {
  try {
    const id = ctx?.params?.id as string | undefined;
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });

    const theCase = await prisma.case.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!theCase) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ ok: true, case: theCase });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

/** Обновить заголовок/статус/следующий дедлайн */
export async function PATCH(req: Request, ctx: any) {
  try {
    const id = ctx?.params?.id as string | undefined;
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const title = safeStr(body?.title, 200);
    const statusIn = safeStr(body?.status, 20);
    const status = statusIn && ALLOWED_STATUS.has(statusIn) ? statusIn : undefined;
    const nextDueAt = body?.nextDueAt === null ? null : safeDate(body?.nextDueAt);

    // формируем объект обновления только с переданными полями
    const data: any = {};
    if (title !== null && title !== undefined) data.title = title;
    if (status) data.status = status;
    if (body?.nextDueAt !== undefined) data.nextDueAt = nextDueAt;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ ok: false, error: 'NO_FIELDS_TO_UPDATE' }, { status: 400 });
    }

    const updated = await prisma.case.update({
      where: { id },
      data,
      include: { items: true },
    });

    return NextResponse.json({ ok: true, case: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

/** Удалить дело (элементы удалятся каскадом по схеме) */
export async function DELETE(_req: Request, ctx: any) {
  try {
    const id = ctx?.params?.id as string | undefined;
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });

    await prisma.case.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    }
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
