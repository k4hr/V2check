// Runtime admin endpoint to apply the hotfix SQL (no schema regeneration).
// GET /api/admin/run-sql?token=YOUR_ADMIN_TOKEN
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SQL = `
-- Prisma/Postgres hotfix: convert User.id from INT to TEXT (cuid) and fix FK in Favorite.userId
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Favorite_userId_fkey'
  ) THEN
    ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_fkey";
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT';
EXCEPTION WHEN undefined_table THEN NULL;
WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE "User" ALTER COLUMN "id" TYPE text USING "id"::text';
EXCEPTION WHEN undefined_table THEN NULL;
WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'DROP SEQUENCE IF EXISTS "User_id_seq"';
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$
BEGIN
  EXECUTE 'ALTER TABLE "Favorite" ALTER COLUMN "userId" TYPE text USING "userId"::text';
EXCEPTION WHEN undefined_table THEN NULL;
WHEN undefined_column THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'favorite' AND column_name = 'userId'
  ) THEN
    ALTER TABLE "Favorite"
      ADD CONSTRAINT "Favorite_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
`;

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }
  try {
    await prisma.$executeRawUnsafe(SQL)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}