// v2check/app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData } from '@/lib/auth/verifyInitData';

/**
 * Возвращает данные пользователя и статус подписки.
 * Принимает initData из:
 *  - заголовка x-telegram-init-data (middleware также копирует x-init-data сюда)
 *  - либо из JSON { initData } (fallback)
 */
async function handle(req: NextRequest) {
  try {
    const hdrInit =
      req.headers.get('x-telegram-init-data') ||
      req.headers.get('x-init-data') || // на всякий случай, если middleware не сработал
      '';

    const bodyInit = await req
      .json()
      .then((j) => (j?.initData as string) || '')
      .catch(() => '');

    const initData = hdrInit || bodyInit || '';
    const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';

    const v = verifyInitData(initData, BOT_TOKEN);
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const u = v.data?.user || {};
    const telegramId = String(u?.id ?? '');
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'NO_TG_ID' }, { status: 401 });
    }

    // upsert пользователя в БД
    const base = {
      telegramId,
      username: u.username ?? null,
      firstName: u.first_name ?? null,
      lastName: u.last_name ?? null,
      photoUrl: u.photo_url ?? null,
    };

    const dbUser = await prisma.user.upsert({
      where: { telegramId },
      update: base,
      create: base,
      include: { favorites: false },
    });

    const until = dbUser.subscriptionUntil ? new Date(dbUser.subscriptionUntil) : null;
    const isPro = until ? Date.now() < until.getTime() : false;

    return NextResponse.json({
      ok: true,
      user: {
        telegramId,
        username: dbUser.username,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        photoUrl: dbUser.photoUrl,
        subscriptionUntil: until ? until.toISOString() : null,
        isPro,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handle(req);
}

export async function GET(req: NextRequest) {
  // Удобно иметь и GET, и POST — для отладки/диагностики.
  return handle(req);
}
