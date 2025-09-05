import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTelegramIdStrict } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = getTelegramIdStrict(req);

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
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const telegramId = getTelegramIdStrict(req);
    const body = await req.json().catch(() => ({}));
    const { title, url } = body ?? {};

    if (!title || !url) {
      return NextResponse.json({ ok: false, error: 'title and url are required' }, { status: 400 });
    }

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
