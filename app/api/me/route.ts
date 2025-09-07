// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramId } from '@/lib/auth'; // оставляю твой хелпер

const prisma = new PrismaClient();

// Аккуратно читаем telegramId: сначала из query (?telegramId=...),
// иначе через ваш getTelegramId(req) (initData/заголовки/куки)
async function resolveTelegramId(req: NextRequest): Promise<string | null> {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get('telegramId');
  if (fromQuery) return String(fromQuery);

  try {
    const id = await (getTelegramId as any)(req);
    if (id) return String(id);
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const telegramId = await resolveTelegramId(req);
    if (!telegramId) {
      return NextResponse.json({ ok: false, error: 'TELEGRAM_ID_NOT_FOUND' }, { status: 401 });
    }

    // гарантируем наличие пользователя (upsert не меняет верстку и не ломает данные)
    const user = await prisma.user.upsert({
      where:  { telegramId },
      update: {},
      create: { telegramId },
      select: { telegramId: true, subscriptionUntil: true },
    });

    const until = user.subscriptionUntil ?? null;
    const isActive = !!(until && until > new Date());

    return NextResponse.json({
      ok: true,
      user: {
        telegramId: user.telegramId,
        subscriptionUntil: until ? until.toISOString() : null,
        isActive,
      },
      // для удобства фронта добавляю готовую метку
      label: isActive && until
        ? `активна до ${until.toLocaleDateString('ru-RU')}`
        : 'подписка неактивна',
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: 'INTERNAL', detail: String(e?.message ?? e) },
      { status: 500 },
    );
  }
}
