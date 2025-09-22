import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/twa-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const kind = String(body?.kind || '').trim(); // note | step | deadline | doc
    const title = String(body?.title || '').trim();
    const bodyText = body?.body ? String(body.body) : null;
    const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
    const priority = typeof body?.priority === 'number' ? body.priority : null;

    if (!['note','step','deadline','doc'].includes(kind)) {
      return NextResponse.json({ ok: false, error: 'BAD_KIND' }, { status: 400 });
    }
    if (!title) {
      return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 });
    }

    // проверим, что дело принадлежит юзеру
    const c = await prisma.case.findFirst({ where: { id: params.id, userId: user.id } });
    if (!c) return NextResponse.json({ ok: false, error: 'CASE_NOT_FOUND' }, { status: 404 });

    const created = await prisma.caseItem.create({
      data: {
        caseId: c.id, kind, title, body: bodyText, dueAt, priority
      }
    });

    // подкинем nextDueAt для кейса
    if (kind === 'deadline' && dueAt) {
      const next = await prisma.caseItem.findFirst({
        where: { caseId: c.id, kind: 'deadline', dueAt: { not: null } },
        orderBy: { dueAt: 'asc' },
        select: { dueAt: true }
      });
      await prisma.case.update({ where: { id: c.id }, data: { nextDueAt: next?.dueAt || null } });
    }

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 400 });
  }
}
