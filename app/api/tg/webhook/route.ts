import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET || 'supersecret12345';

type TGUser = {
  id: number; is_bot?: boolean;
  username?: string; first_name?: string; last_name?: string;
};

export async function POST(req: Request) {
  try {
    // проверка секрета от Telegram
    if (WEBHOOK_SECRET) {
      const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
      if (got !== WEBHOOK_SECRET) return NextResponse.json({ ok:true, skip:'bad_secret' });
    }

    const update = await req.json().catch(() => ({}));
    const msg = update?.message;
    if (!msg) return NextResponse.json({ ok:true, skip:'no_message' });

    const chat = msg.chat || {};
    if (chat?.type !== 'private') return NextResponse.json({ ok:true, skip:'not_private' });

    const text: string = String(msg.text || '');
    if (!text.startsWith('/start')) return NextResponse.json({ ok:true, skip:'not_start' });

    const from: TGUser | undefined = msg.from;
    const tgId = String(from?.id || chat.id || '');
    if (!tgId) return NextResponse.json({ ok:true, skip:'no_tg_id' });

    // апсёрт пользователя
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

    // логируем факт /start
    await prisma.startEvent.create({
      data: {
        userId: user.id,
        chatId: tgId,
        username: user.username || null,
        payload: text.slice(6).trim() || null,  // старт-параметр
        via: 'private',
        // meta: update, // можешь включить, если нужно хранить сырой апдейт
      },
    });

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    // отвечаем 200, чтобы TG не ретраил
    return NextResponse.json({ ok:true, error:String(e?.message || e) });
  }
}

export const GET = async () => NextResponse.json({ ok:true, route:'/api/tg/webhook' });
