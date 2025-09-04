import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyInitData } from '@/lib/telegramAuth'

async function getTelegramId(req: Request) {
  const initData =
    req.headers.get('x-init-data') ||
    new URL(req.url).searchParams.get('initData');
  if (!initData) throw new Error('UNAUTHORIZED');
  const v: any = await verifyInitData(String(initData));
  if (!v?.ok || !v?.data?.telegramId) throw new Error('UNAUTHORIZED');
  return String(v.data.telegramId);
}

async function ensureUserAndGetNumericId(telegramId: string) {
  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {},
    create: { telegramId },
    select: { id: true },
  });
  return user.id;
}

export async function GET(req: Request) {
  try {
    const telegramId = await getTelegramId(req);
    const userId = await ensureUserAndGetNumericId(telegramId);
    const items = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_LIST_FAILED' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const telegramId = await getTelegramId(req);
    const { title, url, note } = (await req.json()) ?? {};
    if (!title || !url) throw new Error('TITLE_URL_REQUIRED');
    const userId = await ensureUserAndGetNumericId(telegramId);
    const created = await prisma.favorite.create({
      data: { userId, title, url, note: note ?? null },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_CREATE_FAILED' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const telegramId = await getTelegramId(req);
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get('id'));
    if (!id) throw new Error('ID_REQUIRED');
    const userId = await ensureUserAndGetNumericId(telegramId);
    await prisma.favorite.delete({
      where: { id, userId },
    } as any);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'FAV_DELETE_FAILED' }, { status: 400 });
  }
}
