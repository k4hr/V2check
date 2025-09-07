// app/api/favorites/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramIdStrict } from '@/lib/auth/verifyInitData';

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
    const telegramId = await getTelegramIdStrict(req);
    const { title, url } = await req.json();

    if (!title || !url) {
      return NextResponse.json(
        { ok: false, error: 'TITLE_OR_URL_MISSING' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'USER_NOT_FOUND' },
        { status: 404 },
      );
    }

    const created = await prisma.favorite.create({
      data: { userId: user.id, title, url },
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
    const telegramId = await getTelegramIdStrict(req);
    const urlObj = new URL(req.url);
    const id = urlObj.searchParams.get('id') || ''; // <-- id строковый
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID_REQUIRED' },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) return NextResponse.json({ ok: true });

    await prisma.favorite.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 400 },
    );
  }
}
