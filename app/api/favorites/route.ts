import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
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
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });

    const { title, url } = await req.json();
    if (!title || !url) {
      return NextResponse.json({ ok: false, error: 'TITLE_URL_REQUIRED' }, { status: 400 });
    }

    const created = await prisma.favorite.create({
      data: { userId: user.id, title, url },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_CREATE_FAILED' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const idRaw = searchParams.get('id');
    const id = Number(idRaw);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ ok: false, error: 'BAD_ID' }, { status: 400 });
    }

    // удаляем только свои
    const deleted = await prisma.favorite.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true, item: deleted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_DELETE_FAILED' }, { status: 500 });
  }
}