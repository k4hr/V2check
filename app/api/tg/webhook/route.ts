import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Секрет из setWebhook. Дам фолбэк на твой, но лучше держать в ENV.
const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET || 'supersecret12345';

type TGUser = {
  id: number; is_bot?: boolean;
  username?: string; first_name?: string; last_name?: string;
};

export async function POST(req: Request) {
  try {
    // 1) Проверка секрета от Telegram (header ставится самим ТГ при вызове вебхука)
    if (WEBHOOK_SECRET) {
      const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
      if (got !== WEBHOOK_SECRET) return NextResponse.json({ ok: true, skip: 'bad_secret' });
    }

    // 2) Разбираем апдейт
    const update = await req.json().catch(() => ({}));
    const msg = update?.message;
    if (!msg) return NextResponse.json({ ok: true, skip: 'no_message' });

    const chat = msg.chat || {};
    if (chat?.type !== 'private') return NextResponse.json({ ok: true, skip: 'not_private' });

    const text: string = String(msg.text || '');
    if (!text.startsWith('/start')) return NextResponse.json({ ok: true, skip: 'not_start' });

    // 3) Достаём отправителя
    const from: TGUser | undefined = msg.from;
    const tgId = String(from?.id || chat.id || '');
    if (!tgId) return NextResponse.json({ ok: true, skip: 'no_tg_id' });

    // 4) Апсёрт профиля и отметка startedAt
    await prisma.user.upsert({
      where: { telegramId: tgId },
      create: {
        telegramId: tgId,
        username: from?.username || null,
        firstName: from?.first_name || null,
        lastName: from?.last_name || null,
        startedAt: new Date(),
        lastSeenAt: new Date(),
      },
      update: {
        username: from?.username || undefined,
        firstName: from?.first_name || undefined,
        lastName: from?.last_name || undefined,
        lastSeenAt: new Date(),
      },
    });

    // Если уже существовал — проставим startedAt только если он пустой
    await prisma.user.updateMany({
      where: { telegramId: tgId, startedAt: null },
      data: { startedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // Возвращаем 200, чтобы ТГ не ретраил пачками
    return NextResponse.json({ ok: true, error: String(e?.message || e) });
  }
}

// Пусть GET тоже отвечает (удобно для “жив ли роут”)
export const GET = async () => NextResponse.json({ ok: true, route: '/api/tg/webhook' });
