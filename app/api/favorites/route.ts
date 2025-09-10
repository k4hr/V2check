// app/api/favorites/route.ts
// Фикс: убрали select с несуществующим полем, и сделали DELETE по строковому id.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTelegramIdStrict } from '@/lib/auth/verifyInitData';

// GET: список избранного
export async function GET(req: Request) {
  try {
    const telegramId = await getTelegramIdStrict(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: true, items: [] });

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
      // без select — вернём все поля согласно реальной схеме
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const msg = e?.message || 'Server error';
    const code = msg === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}

// POST: добавить в избранное
export async function POST(req: Request) {
  try {
    const telegramId = await getTelegramIdStrict(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const data: Record<string, any> = {
      userId: user.id,
      title: body.title ?? body.text ?? null,
      note: body.note ?? null,
    };
    if (body.url != null) data.url = body.url;
    if (body.docId != null) data.docId = body.docId;
    if (body.code != null) data.code = body.code;
    if (body.text != null && data.title == null) data.title = body.text;

    // @ts-ignore — на случай, если в твоей схеме есть доп. поля
    const created = await prisma.favorite.create({ data });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    const msg = e?.message || 'Server error';
    const code = msg === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}

// DELETE: удалить из избранного (?id=<строка>)
export async function DELETE(req: Request) {
  try {
    const telegramId = await getTelegramIdStrict(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });

    const url = new URL(req.url);
    const id = url.searchParams.get('id')?.trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: 'BAD_ID' }, { status: 400 });
    }

    // Удаляем только запись, принадлежащую этому пользователю
    await prisma.favorite.deleteMany({ where: { id, userId: user.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'Server error';
    const code = msg === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
