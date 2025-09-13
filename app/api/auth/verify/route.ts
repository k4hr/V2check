// app/api/auth/verify/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { verifyInitData, getTelegramIdStrict } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

function readInitData(req: NextRequest): string {
  // 1) тело JSON: { initData: "..." }
  // 2) заголовок: x-init-data
  // 3) query: ?initData=...
  try {
    // В body может не быть JSON — не падаем
    // @ts-expect-error - body может отсутствовать
    const clone = req.clone();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return (async () => {
      try {
        const j = await clone.json().catch(() => null);
        if (j && typeof j.initData === 'string') return j.initData as string;
      } catch {}
      return '';
    })() as unknown as string;
  } catch {
    /* ignore */
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: 'BOT_TOKEN_MISSING' },
        { status: 500 }
      );
    }

    // Собираем initData из 3 источников
    let initData = '';
    // 1) тело
    try {
      const body = await req.json().catch(() => null);
      if (body && typeof body.initData === 'string') initData = body.initData;
    } catch { /* ignore */ }

    // 2) заголовок
    if (!initData) {
      const fromHeader = req.headers.get('x-init-data');
      if (fromHeader) initData = fromHeader;
    }

    // 3) query
    if (!initData) {
      const url = new URL(req.url);
      const fromQuery = url.searchParams.get('initData');
      if (fromQuery) initData = fromQuery;
    }

    if (!initData || typeof initData !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'INIT_DATA_REQUIRED' },
        { status: 400 }
      );
    }

    // Верификация HMAC — строго boolean
    const verified: boolean = verifyInitData(initData, BOT_TOKEN);
    if (!verified) {
      return NextResponse.json(
        { ok: false, error: 'INVALID_INIT_DATA' },
        { status: 401 }
      );
    }

    // Достаём telegramId — если нет, 400
    let telegramId = '';
    try {
      telegramId = getTelegramIdStrict(initData);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'NO_TELEGRAM_ID' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: { telegramId },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
