import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramIdStrict } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramIdStrict(req);
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ ok: true, items: [] });

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, url: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json({ ok: true, items: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, url } = await req.json();
    if (!title || !url) {
      return NextResponse.json({ ok: false, error: 'TITLE_AND_URL_REQUIRED' }, { status: 400 });
    }

    const telegramId = await getTelegramIdStrict(req);
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: { id: true },
    });

    const created = await prisma.favorite.create({
      data: { userId: user.id, title, url },
      select: { id: true, title: true, url: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const telegramId = await getTelegramIdStrict(req);
    const id = req.nextUrl.searchParams.get('id') || '';
    if (!id) {
      return NextResponse.json({ ok: false, error: 'ID_REQUIRED' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ ok: true });

    await prisma.favorite.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
  }
}
