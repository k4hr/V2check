// app/api/admin/patch/fix-schema/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ADMIN_KEY = (process.env.ADMIN_KEY || '').trim();

function getAdminKey(req: NextRequest) {
  const h = req.headers.get('x-admin-key');
  if (h) return h.trim();
  const url = new URL(req.url);
  return (url.searchParams.get('key') || '').trim();
}

async function exec(sql: string) {
  // одна точка входа для логируемых idempotent-скриптов
  await prisma.$executeRawUnsafe(sql);
  return sql;
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_KEY) return NextResponse.json({ ok: false, error: 'ADMIN_KEY_MISSING' }, { status: 500 });
    if (getAdminKey(req) !== ADMIN_KEY) return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });

    const ran: string[] = [];

    // --- 1) Структура колонок как в prisma/schema.prisma ---
    ran.push(await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;`));
    ran.push(await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;`));
    ran.push(await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName"  TEXT;`));
    ran.push(await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionUntil" TIMESTAMP;`));
    ran.push(await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP;`));
    ran.push(await exec(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP;`));

    // --- 2) Значения по умолчанию + заполнение исторических NULL ---
    ran.push(await exec(`UPDATE "User" SET "createdAt" = COALESCE("createdAt", now());`));
    ran.push(await exec(`UPDATE "User" SET "updatedAt" = COALESCE("updatedAt", now());`));
    ran.push(await exec(`ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now();`));
    ran.push(await exec(`ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();`));
    ran.push(await exec(`ALTER TABLE "User" ALTER COLUMN "createdAt" SET NOT NULL;`));
    ran.push(await exec(`ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;`));

    // --- 3) Почистить устаревшее поле (если осталось) ---
    ran.push(await exec(`ALTER TABLE "User" DROP COLUMN IF EXISTS "photoUrl";`));

    // --- 4) Ограничения/индексы ---
    ran.push(await exec(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_pkey') THEN
          ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
        END IF;
      END $$;`));

    ran.push(await exec(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_telegramId_key') THEN
          CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
        END IF;
      END $$;`));

    return NextResponse.json({ ok: true, applied: true, sql: ran });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// удобный GET, чтобы дергать из браузера
export const GET = POST;
