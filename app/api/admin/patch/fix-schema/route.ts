// app/api/admin/patch/fix-schema/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma = new PrismaClient();
const ADMIN_KEY = (process.env.ADMIN_KEY || '').trim();

function getAdminKey(req: NextRequest) {
  const h = req.headers.get('x-admin-key');
  if (h) return h.trim();
  const url = new URL(req.url);
  return (url.searchParams.get('key') || '').trim();
}

async function run(sql: string, acc: string[]) {
  await prisma.$executeRawUnsafe(sql);
  acc.push(sql);
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'ADMIN_KEY_MISSING' }, { status: 500 });
    }
    if (getAdminKey(req) !== ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    const ran: string[] = [];

    // 1) Добавляем недостающие поля из prisma/schema.prisma
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;`, ran);
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;`, ran);
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName"  TEXT;`, ran);
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionUntil" TIMESTAMP;`, ran);
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP;`, ran);
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP;`, ran);

    // 2) Заполняем NULL и ставим дефолты/NOT NULL для дат
    await run(`UPDATE "User" SET "createdAt" = COALESCE("createdAt", now());`, ran);
    await run(`UPDATE "User" SET "updatedAt" = COALESCE("updatedAt", now());`, ran);
    await run(`ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now();`, ran);
    await run(`ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();`, ran);
    await run(`ALTER TABLE "User" ALTER COLUMN "createdAt" SET NOT NULL;`, ran);
    await run(`ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;`, ran);

    // 3) Чистим лишнее поле (если где-то осталось)
    await run(`ALTER TABLE "User" DROP COLUMN IF EXISTS "photoUrl";`, ran);

    // 4) Ограничения/индексы
    await run(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_pkey') THEN
          ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
        END IF;
      END $$;`, ran);

    await run(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_telegramId_key') THEN
          CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
        END IF;
      END $$;`, ran);

    return NextResponse.json({ ok: true, applied: true, sql: ran });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// Удобный GET из браузера
export const GET = POST;
