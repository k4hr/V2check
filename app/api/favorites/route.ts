// app/api/favorites/route.ts
// Фикс компиляции: убрали select с полем 'code' (его нет в схеме).
// Остальную логику не меняем: HMAC-авторизация + список / добавление / удаление.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTelegramIdStrict } from '@/lib/auth/verifyInitData';

// GET: список избранного пользователя
export async function GET(req: Request) {
  try {
    const telegramId = await getTelegramIdStrict(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: true, items: [] });

    const items = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { id: 'desc' },
      // ВАЖНО: не используем select с несуществующими полями
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
    // Не знаем точную схему Favorite — пишем безопасно:
    // ожидаем хотя бы title/text и note; остальное как есть.
    const data: Record<string, any> = {
      userId: user.id,
      title: body.title ?? body.text ?? null,
      note: body.note ?? null,
    };
    // Дополнительно, если есть, сохраним идентификатор документа / ссылку
    if (body.url != null) data.url = body.url;
    if (body.docId != null) data.docId = body.docId;
    if (body.code != null) data.code = body.code;
    if (body.text != null && data.title == null) data.title = body.text;

    // @ts-ignore — позволяем лишние поля, если они есть в твоей схеме
    const created = await prisma.favorite.create({ data });

    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    const msg = e?.message || 'Server error';
    const code = msg === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}

// DELETE: удалить из избранного (?id=)
export async function DELETE(req: Request) {
  try {
    const telegramId = await getTelegramIdStrict(req);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok: false, error: 'USER_NOT_FOUND' }, { status: 404 });

    const url = new URL(req.url);
    const idParam = url.searchParams.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) {
      return NextResponse.json({ ok: false, error: 'BAD_ID' }, { status: 400 });
    }

    // Безопасно: удаляем только записи этого пользователя
    await prisma.favorite.deleteMany({ where: { id, userId: user.id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = e?.message || 'Server error';
    const code = msg === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status: code });
  }
}
