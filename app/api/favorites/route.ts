import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const telegramId = await getTelegramId(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: true, items: [] });

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const telegramId = await getTelegramId(req);
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: { id: true },
    });

    const { title, url } = await req.json();
    if (!title || !url) return NextResponse.json({ ok: false, error: 'title and url required' }, { status: 400 });

    const created = await prisma.favorite.create({
      data: { userId: user.id, title, url },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: 'BAD_ID' }, { status: 400 });

    await prisma.favorite.delete({ where: { id } as any });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
