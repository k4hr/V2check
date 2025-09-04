import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '../../../lib/prisma';
import { verifyInitData } from '../../../lib/auth/verifyInitData';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

// Читаем initData только из заголовка, как в остальном проекте
async function getTelegramId(req: NextRequest): Promise<string> {
  const initData = req.headers.get('x-init-data') || '';
  if (!initData) throw new Error('UNAUTHORIZED');
  const v = await verifyInitData(String(initData), String(BOT_TOKEN));
  const tgId = (v as any)?.ok ? (v as any)?.payload?.user?.id : null;
  if (!tgId) throw new Error('UNAUTHORIZED');
  return String(tgId);
}

// GET /api/favorites — отдать избранное пользователя
export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const items = await prisma.favorite.findMany({
      where: { telegramId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const code = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: code });
  }
}

// POST /api/favorites — добавить элемент { title, url?, note? }
export async function POST(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const body = await req.json().catch(() => ({}));
    const { title, url = null, note = null } = body || {};
    if (!title) return NextResponse.json({ ok: false, error: 'title required' }, { status: 400 });

    const created = await prisma.favorite.create({
      data: { telegramId, title, url, note },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e: any) {
    const code = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: code });
  }
}

// DELETE /api/favorites?id=... — удалить свой элемент
export async function DELETE(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const idParam = req.nextUrl.searchParams.get('id');
    const id = idParam ? String(idParam) : null;
    if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

    const exist = await prisma.favorite.findUnique({ where: { id } });
    if (!exist || exist.telegramId !== telegramId) {
      return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
    }

    await prisma.favorite.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const code = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: code });
  }
}
