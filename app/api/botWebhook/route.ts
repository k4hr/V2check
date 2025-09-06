\
// app/api/botWebhook/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PLAN_MS: Record<string, number> = {
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  HALF: 182 * 24 * 60 * 60 * 1000, // полгода
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

export async function POST(req: Request) {
  try {
    const update = await req.json();
    const sp = update?.message?.successful_payment;
    if (!sp) return NextResponse.json({ ok: true });

    const userId: string = String(update?.message?.from?.id || '');
    if (!userId) return NextResponse.json({ ok: false, error: 'NO_TELEGRAM_ID' }, { status: 400 });

    const rawPayload: string = sp?.invoice_payload || '';
    const plan = rawPayload.split(':')[1]?.toUpperCase();
    const addMs = plan && PLAN_MS[plan] ? PLAN_MS[plan] : 0;
    if (!addMs) return NextResponse.json({ ok: false, error: 'UNKNOWN_PLAN' }, { status: 400 });

    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionUntil" TIMESTAMPTZ`);

    await prisma.$executeRaw`INSERT INTO "User" ("telegramId") VALUES (${userId}) ON CONFLICT ("telegramId") DO NOTHING`;

    const rows: any[] = await prisma.$queryRaw`SELECT "subscriptionUntil" FROM "User" WHERE "telegramId" = ${userId} LIMIT 1`;
    const now = new Date();
    const current: Date | null = rows?.[0]?.subscriptionUntil ? new Date(rows[0].subscriptionUntil) : null;
    const base = current && current > now ? current : now;
    const newUntil = new Date(base.getTime() + addMs);

    await prisma.$executeRaw`UPDATE "User" SET "subscriptionUntil" = ${newUntil.toISOString()}::timestamptz WHERE "telegramId" = ${userId}`;

    return NextResponse.json({ ok: true, subscriptionUntil: newUntil.toISOString() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
