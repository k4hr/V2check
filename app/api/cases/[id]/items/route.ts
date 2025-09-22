// app/api/cases/[id]/items/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeDate(input: any): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function safeTitle(t: any): string {
  const s = String(t ?? '').trim();
  return s.slice(0, 200);
}

/** Список элементов дела */
export async function GET(_req: Request, ctx: any) {
  try {
    const id = ctx?.params?.id as string | undefined;
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });

    const items = await prisma.caseItem.findMany({
      where: { caseId: id },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

/** Создание элемента дела */
export async function POST(req: Request, ctx: any) {
  try {
    const id = ctx?.params?.id as string | undefined;
    if (!id) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });

    const body = await req.json().catch(() => ({}));

    const kind = (body?.kind ?? 'note') as string; // note | step | deadline | doc
    const title = safeTitle(body?.title);
    if (!title) return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 });

    const item = await prisma.caseItem.create({
      data: {
        caseId: id,
        kind,
        title,
        body: body?.body ?? null,
        dueAt: safeDate(body?.dueAt),
        done: Boolean(body?.done ?? false),
        priority: typeof body?.priority === 'number' ? body.priority : null,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
