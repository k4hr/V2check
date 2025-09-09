// app/api/favorites/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) return NextResponse.json({ ok: true, items: [] });

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ ok: true, items: [] });

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) throw new Error('UNAUTHORIZED');

    const { title, url, note } = await req.json();

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: { id: true },
    });

    const created = await prisma.favorite.create({
      data: {
        userId: user.id,
        title: String(title ?? ''),
        url: url ? String(url) : null,
        note: note ? String(note) : null,
      },
    });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    if (!telegramId) throw new Error('UNAUTHORIZED');

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id ?? '');

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user || !id) return NextResponse.json({ ok: true });

    await prisma.favorite.deleteMany({
      where: { id, userId: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}
