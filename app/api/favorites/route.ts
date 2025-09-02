import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyInitData } from '../../../lib/auth/verifyInitData';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

// Read Telegram initData ONLY from header to avoid double-read of body
async function getTelegramId(req: NextRequest): Promise<string> {
  const initData = req.headers.get('x-init-data') || '';
  if (!initData) throw new Error('UNAUTHORIZED');
  const v = await verifyInitData(String(initData), String(BOT_TOKEN));
  if (!v?.ok || !v?.data?.telegramId) throw new Error('UNAUTHORIZED');
  return String(v.data.telegramId);
}

// GET: list favorites for current user
export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const items = await prisma.favorite.findMany({
      where: { telegramId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const code = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: code });
  }
}

// POST: add new favorite { title, url?, note? }
export async function POST(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const body = await req.json().catch(() => ({} as any));
    const title = String(body?.title || '').trim();
    if (!title) return NextResponse.json({ ok:false, error:'title required' }, { status: 400 });
    const url  = body?.url ? String(body.url) : null;
    const note = body?.note ? String(body.note) : null;

    const item = await prisma.favorite.create({
      data: { telegramId, title, url, note },
    });
    return NextResponse.json({ ok:true, item });
  } catch (e: any) {
    const code = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: code });
  }
}

// DELETE: /api/favorites?id=<id>
export async function DELETE(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    const id = new URL(req.url).searchParams.get('id') || '';
    if (!id) return NextResponse.json({ ok:false, error:'id required' }, { status: 400 });

    const exist = await prisma.favorite.findUnique({ where: { id } });
    if (!exist || exist.telegramId !== telegramId) {
      return NextResponse.json({ ok:false, error:'Not found' }, { status: 404 });
    }

    await prisma.favorite.delete({ where: { id } });
    return NextResponse.json({ ok:true });
  } catch (e:any) {
    const code = e?.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json({ ok:false, error: e?.message || 'Server error' }, { status: code });
  }
}
