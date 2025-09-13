// app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyInitData, extractTelegramId, getInitDataFrom } from '@/lib/auth/verifyInitData';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function POST(req: NextRequest) {
  try {
    const initData = await getInitDataFrom(req);

    // если нет токена бота — не заваливаем фронт, просто скажем нет подписки
    if (!BOT_TOKEN || !initData || !verifyInitData(initData, BOT_TOKEN)) {
      return NextResponse.json({ ok: true, subscription: null });
    }

    const telegramId = extractTelegramId(initData);
    if (!telegramId) {
      return NextResponse.json({ ok: true, subscription: null });
    }

    const user = await prisma.user.findUnique({ where: { telegramId } });

    const now = new Date();
    const until = user?.subscriptionUntil ?? null;
    const isActive = until ? until.getTime() > now.getTime() : false;

    return NextResponse.json({
      ok: true,
      subscription: isActive ? { expiresAt: until!.toISOString() } : null,
      // на будущее — вдруг пригодится на клиенте
      user: user
        ? { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName }
        : null,
    });
  } catch (e: any) {
    // даже при ошибке — возвращаем ок:true + нет подписки,
    // чтобы на клиенте не появлялось «Не удалось получить статус»
    return NextResponse.json({ ok: true, subscription: null });
  }
}
