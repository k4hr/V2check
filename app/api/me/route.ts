import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseTgUser, getTelegramIdStrict } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const tg = parseTgUser(req);
    const telegramId = getTelegramIdStrict(req);

    // синхронизируем профиль пользователя (без обязательных полей)
    await prisma.user.upsert({
      where: { telegramId },
      update: {
        firstName: tg?.first_name ?? null,
        lastName:  tg?.last_name  ?? null,
        username:  tg?.username   ?? null,
        photoUrl:  tg?.photo_url  ?? null,
      },
      create: {
        telegramId,
        firstName: tg?.first_name ?? null,
        lastName:  tg?.last_name  ?? null,
        username:  tg?.username   ?? null,
        photoUrl:  tg?.photo_url  ?? null,
      },
    });

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { telegramId: true, subscriptionUntil: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 400 });
  }
}
