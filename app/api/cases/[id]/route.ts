import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/twa-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    const item = await prisma.case.findFirst({
      where: { id: params.id, userId: user.id },
      include: {
        items: { orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }] }
      }
    });
    if (!item) return NextResponse.json({ ok: false, error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const data: any = {};
    if (body.title)  data.title  = String(body.title).trim();
    if (body.status) data.status = String(body.status).trim();

    const updated = await prisma.case.update({
      where: { id: params.id },
      data,
      select: { id: true, title: true, status: true }
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getUserFromRequest(req);
    await prisma.case.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 400 });
  }
}
