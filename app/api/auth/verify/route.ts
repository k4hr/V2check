// app/api/auth/verify/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { verifyInitData, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING' },
        { status: 500 }
      );
    }

    // 1) пытаемся прочитать из body
    let initData = '';
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body.initData === 'string') {
        initData = body.initData;
      }
    } catch {
      /* ignore */
    }

    // 2) если нет — из заголовка
    if (!initData) {
      const fromHeader = req.headers.get('x-init-data');
      if (fromHeader) initData = fromHeader;
    }

    // 3) если нет — из query
    if (!initData) {
      const url = new URL(req.url);
      const fromQuery = url.searchParams.get('initData');
      if (fromQuery) initData = fromQuery;
    }

    if (!initData) {
      return NextResponse.json(
        { ok: false, error: 'INIT_DATA_REQUIRED' },
        { status: 400 }
      );
    }

    // Проверка HMAC (строго boolean)
    const ok = verifyInitData(initData, BOT_TOKEN);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_INIT_DATA' },
        { status: 401 }
      );
    }

    // Достаём telegramId
    let telegramId = '';
    try {
      telegramId = getTelegramIdStrict(initData);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'NO_TELEGRAM_ID' },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, user: { telegramId } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
