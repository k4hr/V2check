\
// app/api/me/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getTelegramId } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const telegramId = await (getTelegramId as any)(req);
    if (!telegramId) return NextResponse.json({ ok: false, error: 'TELEGRAM_ID_NOT_FOUND' }, { status: 400 });

    await prisma.$executeRaw`INSERT INTO "User" ("telegramId") VALUES (${telegramId}) ON CONFLICT ("telegramId") DO NOTHING`;
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionUntil" TIMESTAMPTZ`);

    const rows: any[] = await prisma.$queryRaw`SELECT "subscriptionUntil" FROM "User" WHERE "telegramId" = ${telegramId} LIMIT 1`;
    const until: Date | null = rows?.[0]?.subscriptionUntil ? new Date(rows[0].subscriptionUntil) : null;
    const active = !!(until && until > new Date());

    return NextResponse.json({
      ok: true,
      user: {
        telegramId,
        subscriptionUntil: until ? until.toISOString() : null,
        isActive: active,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
