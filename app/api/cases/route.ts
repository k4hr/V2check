import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/twa-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    const items = await prisma.case.findMany({
      where: { userId: user.id },
      orderBy: [{ status: 'asc' }, { nextDueAt: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true, title: true, status: true, createdAt: true, nextDueAt: true,
        _count: { select: { items: true } },
      }
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const title = String(body?.title || '').trim();
    if (!title) return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 });

    const created = await prisma.case.create({
      data: { userId: user.id, title },
      select: { id: true, title: true, status: true, createdAt: true }
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 400 });
  }
}
