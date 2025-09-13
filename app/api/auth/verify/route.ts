// app/api/auth/verify/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { verifyInitData, extractTelegramId, getInitDataFrom } from '@/lib/auth/verifyInitData';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN) {
      return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 });
    }

    // initData берём из body / x-init-data / ?initData= — функция уже всё умеет
    const initData = await getInitDataFrom(req);
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'INIT_DATA_REQUIRED' }, { status: 400 });
    }

    // HMAC-проверка
    const ok = verifyInitData(initData, BOT_TOKEN);
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'INVALID_INIT_DATA' }, { status: 401 });
    }

    // Достаём telegramId из initData
    const telegramId = extractTelegramId(initData);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'NO_TELEGRAM_ID' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user: { telegramId } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
