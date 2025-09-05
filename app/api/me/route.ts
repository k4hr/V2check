// app/api/me/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTelegramId } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramId(req);

    // Гарантируем, что юзер в базе есть
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: { telegramId: true, subscriptionUntil: true },
    });

    const now = new Date();
    const active = !!(user.subscriptionUntil && user.subscriptionUntil > now);

    // Двойной формат: и старый, и новый — чтобы фронт точно не упал
    return NextResponse.json({
      ok: true,
      user,                               // ← старый формат (user.subscriptionUntil)
      subscriptionActive: active,         // ← явный флаг
      subscriptionUntil: user.subscriptionUntil, // ← явное поле
      status: active ? 'ACTIVE' : 'NONE', // ← ещё один флаг на всякий
      until: user.subscriptionUntil ? new Date(user.subscriptionUntil).toISOString() : null,
    });
  } catch (e: any) {
    // Не роняем UI, но сигналим причину
    return NextResponse.json({
      ok: true,
      user: null,
      subscriptionActive: false,
      subscriptionUntil: null,
      status: 'NONE',
      until: null,
      reason: String(e?.message ?? e),
    });
  }
}
