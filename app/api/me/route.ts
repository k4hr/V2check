import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '../../../lib/prisma';
import { verifyInitData } from '../../../lib/auth/verifyInitData';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

function bad(status: number, msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get('x-init-data') || '';
    if (!initData) return bad(401, 'UNAUTHORIZED');

    const v = await verifyInitData(String(initData), String(BOT_TOKEN));
    const u = (v as any)?.ok ? (v as any)?.payload?.user : null;
    if (!u?.id) return bad(401, 'UNAUTHORIZED');

    // В текущей Prisma-схеме User имеет поля:
    // id (Int), telegramId (String @unique), subscription (String?), subscriptionUntil (DateTime?)
    // Поэтому создаём/обновляем только допустимые поля.
    const user = await prisma.user.upsert({
      where: { telegramId: String(u.id) },
      create: { telegramId: String(u.id) },
      update: {},
      select: {
        id: true,
        telegramId: true,
        subscription: true,
        subscriptionUntil: true,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return bad(500, e?.message || 'Server error');
  }
}
