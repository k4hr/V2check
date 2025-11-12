import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Безопасность: бот должен прислать заголовок x-admin-token == ADMIN_TOKEN */
const ADMIN_TOKEN = (process.env.ADMIN_TOKEN || '').trim();

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_TOKEN) {
      return NextResponse.json({ ok: false, error: 'ADMIN_TOKEN_NOT_SET' }, { status: 500 });
    }
    const got = (req.headers.get('x-admin-token') || '').trim();
    if (got !== ADMIN_TOKEN) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const telegramId = String(body?.telegramId || '').trim();
    if (!/^\d{3,20}$/.test(telegramId)) {
      return NextResponse.json({ ok: false, error: 'BAD_TELEGRAM_ID' }, { status: 400 });
    }

    // создаём запись пользователя, если её нет
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},                                 // можно обновлять username/locale, если хранишь
      create: { telegramId },                     // createdAt выступит как «время /start»
      select: { id: true, telegramId: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}

// Для простого пинга
export async function GET() {
  return NextResponse.json({ ok: true, ping: 'tg/start alive' });
}
