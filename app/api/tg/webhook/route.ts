/* path: app/api/tg/webhook/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET || 'supersecret12345';

type TGUser = {
  id: number;
  is_bot?: boolean;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export async function POST(req: Request) {
  try {
    // 1) проверка секрета, который задаётся при setWebhook
    if (WEBHOOK_SECRET) {
      const got = req.headers.get('x-telegram-bot-api-secret-token') || '';
      if (got !== WEBHOOK_SECRET) return NextResponse.json({ ok: true, skip: 'bad_secret' });
    }

    // 2) парс апдейта
    const update = await req.json().catch(() => ({}));
    const msg = update?.message;
    if (!msg) return NextResponse.json({ ok: true, skip: 'no_message' });

    if (msg?.chat?.type !== 'private') return NextResponse.json({ ok: true, skip: 'not_private' });
    const text: string = String(msg.text || '');
    if (!text.startsWith('/start')) return NextResponse.json({ ok: true, skip: 'not_start' });

    // 3) данные пользователя
    const from: TGUser | undefined = msg.from;
    const tgId = String(from?.id || msg.chat?.id || '');
    if (!tgId) return NextResponse.json({ ok: true, skip: 'no_tg_id' });

    const now = new Date();

    // 4) апсёрт юзера (не трогаем startedAt здесь, ниже отработаем аккуратно)
    const user = await prisma.user.upsert({
      where: { telegramId: tgId },
      create: {
        telegramId: tgId,
        username: from?.username || null,
        firstName: from?.first_name || null,
        lastName: from?.last_name || null,
        lastSeenAt: now,
        startedAt: now, // новая запись — сразу считаем «нажал старт»
      },
      update: {
        username: from?.username || undefined,
        firstName: from?.first_name || undefined,
        lastName: from?.last_name || undefined,
        lastSeenAt: now,
      },
      select: { id: true, startedAt: true },
    });

    // 5) если был раньше, помечаем startedAt, только если не было
    if (!user.startedAt) {
      await prisma.user.update({
        where: { id: user.id },
        data: { startedAt: now },
      });
    }

    // 6) логируем конкретный StartEvent (удобно для аналитики)
    await prisma.startEvent.create({
      data: {
        userId: user.id,
        payload: text, // там может быть реферальный параметр /start XYZ
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // всегда 200 — чтобы Telegram не зацикливал ретраи
    return NextResponse.json({ ok: true, error: String(e?.message || e) });
  }
}

// Простой health-чек
export const GET = async () => NextResponse.json({ ok: true, route: '/api/tg/webhook' });
