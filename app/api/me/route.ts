// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramIdStrict } from '@/lib/auth';

const prisma = new PrismaClient();

async function resolveTelegramId(req: NextRequest): Promise<string | null> {
  const url = new URL(req.url);
  const q1 = url.searchParams.get('telegramId');
  const q2 = url.searchParams.get('tid');
  if (q1) return String(q1);
  if (q2) return String(q2);

  const override = req.headers.get('x-telegram-id');
  if (override) return String(override);

  try {
    const id = await getTelegramIdStrict(req);
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
