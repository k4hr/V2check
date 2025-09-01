// app/api/me/route.ts — POST: верификация initData и статус подписки
import { NextRequest, NextResponse } from 'next/server';
import { verifyInitData } from '../../../lib/auth/verifyInitData'; // <= ВАЖНО: 3 уровня вверх
import prisma from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const raw = req.headers.get('x-init-data') || '';
    const BOT = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

    const ver = verifyInitData(raw, BOT);
    if (!ver.ok || !ver.payload?.user) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const u = ver.payload.user as {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };

    const user = await prisma.user.upsert({
      where: { telegramId: String(u.id) },
      create: {
        telegramId: String(u.id),
        username: u.username ?? null,
        firstName: u.first_name ?? null,
        lastName: u.last_name ?? null,
        photoUrl: u.photo_url ?? null,
      },
      update: {
        username: u.username ?? null,
        firstName: u.first_name ?? null,
        lastName: u.last_name ?? null,
        photoUrl: u.photo_url ?? null,
      },
    });

    const active = user.expiresAt && user.expiresAt.getTime() > Date.now()
      ? { plan: user.plan || 'Juristum Pro', expiresAt: user.expiresAt.toISOString() }
      : null;

    return NextResponse.json({ ok: true, subscription: active });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
