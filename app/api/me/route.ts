import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { NextRequest } from 'next/server';
import { verifyInitData } from '../../../lib/auth/verifyInitData';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const initData: string | null =
      searchParams.get('initData') || req.headers.get('x-init-data');

    if (!initData) {
      return NextResponse.json({ ok: false, error: 'Missing initData' }, { status: 400 });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ ok: false, error: 'Missing BOT_TOKEN' }, { status: 500 });
    }

    const verified = await verifyInitData(initData, botToken);
    if (!verified || (typeof verified === 'object' && 'ok' in verified && !verified.ok)) {
      return NextResponse.json({ ok: false, error: 'Invalid initData' }, { status: 401 });
    }

    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    const user = userStr ? JSON.parse(userStr) : undefined;
    const telegramId = user?.id ? String(user.id) : undefined;

    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'No user in initData' }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { telegramId } });
    return NextResponse.json({ ok: true, user: dbUser });
  } catch (e: any) {
    console.error('GET /api/me error', e);
    return NextResponse.json({ ok: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
