/* path: app/api/tg/webhook/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET || 'supersecret12345';
const BOT_TOKEN = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';

type TGUser = {
  id: number; is_bot?: boolean;
  username?: string; first_name?: string; last_name?: string;
};

/** отправка простого ответа пользователю */
async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Failed to send Telegram reply:', err);
  }
}

export async function POST(req: Request) {
  try {
    // 1. Проверяем секрет (Telegram его шлёт при каждом вебхуке)
    if (WEBHOOK_SECRET) {
      const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
      if (got !== WEBHOOK_SECRET)
        return NextResponse.json({ ok: true, skip: 'bad_secret' });
    }

    // 2. Разбираем апдейт
    const update = await req.json().catch(() => ({}));
    const msg = update?.message;
    if (!msg) return NextResponse.json({ ok: true, skip: 'no_message' });

    const chat = msg.chat || {};
    if (chat?.type !== 'private')
      return NextResponse.json({ ok: true, skip: 'not_private' });

    const text: string = String(msg.text || '');
    if (!text.startsWith('/start'))
      return NextResponse.json({ ok: true, skip: 'not_start' });

    // 3. Извлекаем пользователя
    const from: TGUser | undefined = msg.from;
    const tgId = String(from?.id || chat.id || '');
    if (!tgId)
      return NextResponse.json({ ok: true, skip: 'no_tg_id' });

    // 4. Апсёрт пользователя
    const user = await prisma.user.upsert({
      where: { telegramId: tgId },
      create: {
        telegramId: tgId,
        username: from?.username || null,
        firstName: from?.first_name || null,
        lastName: from?.last_name || null,
        lastSeenAt: new Date(),
      },
      update: {
        username: from?.username || undefined,
        firstName: from?.first_name || undefined,
        lastName: from?.last_name || undefined,
        lastSeenAt: new Date(),
      },
      select: { id: true, telegramId: true, username: true },
    });

    // 5. Логируем событие /start
    await prisma.startEvent.create({
      data: {
        userId: user.id,
        chatId: tgId,
        username: user.username || null,
        payload: text.slice(6).trim() || null,
        via: 'private',
      },
    });

    // 6. Ответ пользователю
    await sendTelegramMessage(
      tgId,
      '🚀 <b>Привет!</b>\n\nДобро пожаловать 👋\nТы успешно активировал бота. Теперь можно вернуться в приложение и продолжить работу.'
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Webhook error:', e);
    // Telegram требует 200, чтобы не спамить ретраями
    return NextResponse.json({ ok: true, error: String(e?.message || e) });
  }
}

export const GET = async () =>
  NextResponse.json({ ok: true, route: '/api/tg/webhook' });
