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
  const q = url.searchParams.get('key') || url.searchParams.get('admin') || '';
  return (q || '').trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_KEY) return NextResponse.json({ ok:false, error:'ADMIN_KEY_MISSING' }, { status:500 });
    if (getAdminKey(req) !== ADMIN_KEY) return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });

    const sql = [
      // 1) Колонки согласно schema.prisma
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName"  TEXT;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionUntil" TIMESTAMP;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP;',
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP;',

      // 2) Значения по умолчанию и наполнение для старых строк
      'UPDATE "User" SET "createdAt" = COALESCE("createdAt", now());',
      'UPDATE "User" SET "updatedAt" = COALESCE("updatedAt", now());',
      'ALTER TABLE "User" ALTER COLUMN "createdAt" SET DEFAULT now();',
      'ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();',
      'ALTER TABLE "User" ALTER COLUMN "createdAt" SET NOT NULL;',
      'ALTER TABLE "User" ALTER COLUMN "updatedAt" SET NOT NULL;',

      // 3) Ограничения/индексы (аккуратно, если уже есть — не дублируем)
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_pkey') THEN
           ALTER TABLE "User" ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
         END IF;
       END $$;`,
      `DO $$ BEGIN
         IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_telegramId_key') THEN
           CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
         END IF;
       END $$;`
    ];

    for (const s of sql) { await prisma.$executeRawUnsafe(s); }

    return NextResponse.json({ ok:true, applied:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}

export const GET = POST;
