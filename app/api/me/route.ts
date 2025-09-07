// app/api/me/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramIdStrict } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const telegramId = await getTelegramIdStrict(req);

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: { telegramId },
      select: {
        telegramId: true,
        subscriptionUntil: true,
      },
    });

    return NextResponse.json({ ok: true, user }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
