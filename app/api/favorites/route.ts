import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const u = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: { id: true },
    });

    const items = await prisma.favorite.findMany({
      where: { userId: u.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_LIST_FAILED' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const { title, url, note = null } = await req.json();

    if (!title || !url) {
      return NextResponse.json({ ok: false, error: 'TITLE_AND_URL_REQUIRED' }, { status: 400 });
    }

    const u = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: { id: true },
    });

    const created = await prisma.favorite.create({
      data: { userId: u.id, title, url, note },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_CREATE_FAILED' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const u = await prisma.user.findUnique({ where: { telegramId }, select: { id: true } });
    if (!u) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });

    const idParam = req.nextUrl.searchParams.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: 'BAD_ID' }, { status: 400 });
    }

    await prisma.favorite.deleteMany({ where: { id, userId: u.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_DELETE_FAILED' }, { status: 500 });
  }
}
