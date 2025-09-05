import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getTelegramId, getTelegramUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);
    // Создаём пользователя по telegramId, не трогая числовой id и лишние поля
    await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
    });

    // Возвращаем базовую информацию о подписке (если поле есть — отдаём, если нет — null)
    const user = await prisma.user.findUnique({ where: { telegramId } });
    const until: any = (user as any)?.subscriptionUntil ?? (user as any)?.expiresAt ?? null;

    return NextResponse.json({ ok: true, user: { telegramId, subscriptionUntil: until } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'ME_FAILED' }, { status: 500 });
  }
}