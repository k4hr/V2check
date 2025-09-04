import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '../../../lib/prisma';
import { verifyInitData } from '../../../lib/auth/verifyInitData';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

// Берём initData из заголовка (как в остальном проекте)
async function getTelegramId(req: NextRequest): Promise<string> {
  const initData = req.headers.get('x-init-data') || '';
  if (!initData) throw new Error('UNAUTHORIZED');
  const v = await verifyInitData(String(initData), String(BOT_TOKEN));
  const tgId = (v as any)?.ok ? (v as any)?.payload?.user?.id : null;
  if (!tgId) throw new Error('UNAUTHORIZED');
  return String(tgId);
}

// В твоей схеме Favorite связан по userId (Int) -> User.id (Int), а не по telegramId.
// Поэтому гарантируем пользователя и возвращаем его числовой id.
async function ensureUserAndGetId(telegramId: string): Promise<number> {
  const user = await prisma.user.upsert({
    where: { telegramId },
    create: { telegramId },
    update: {},
    select: { id: true },
  });
  return Number(user.id);
}

// GET /api/favorites — список избранного пользователя
export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const userId = await ensureUserAndGetId(telegramId);
    const items = await prisma.favorite.findMany({
      where: { userId },
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
    const userId = await ensureUserAndGetId(telegramId);
    const body = await req.json().catch(() => ({}));
    const { title, url = null, note = null } = body || {};
    if (!title) return NextResponse.json({ ok: false, error: 'title required' }, { status: 400 });

    const created = await prisma.favorite.create({
      data: { userId, title, url, note },
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
    const userId = await ensureUserAndGetId(telegramId);
    const idParam = req.nextUrl.searchParams.get('id');
    const id = idParam ? Number(idParam) : NaN;
    if (!Number.isFinite(id)) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

    await prisma.favorite.deleteMany({ where: { id, userId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const code = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: code });
  }
}
