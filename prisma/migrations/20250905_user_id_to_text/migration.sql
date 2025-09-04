-- Prisma/Postgres hotfix: convert User.id from INT to TEXT (cuid) and fix FK in Favorite.userId
-- Safe to run multiple times.

DO $$
BEGIN
  -- drop FK if exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'Favorite_userId_fkey'
  ) THEN
    ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_userId_fkey";
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Favorite table may not exist yet
  NULL;
END $$;

-- Change User.id
DO $$
BEGIN
  -- Remove default (serial) if any
  EXECUTE 'ALTER TABLE "User" ALTER COLUMN "id" DROP DEFAULT';
EXCEPTION WHEN undefined_table THEN
  -- table not found
  NULL;
WHEN undefined_column THEN
  NULL;
END $$;

DO $$
BEGIN
  -- Change type to text using cast
  EXECUTE 'ALTER TABLE "User" ALTER COLUMN "id" TYPE text USING "id"::text';
EXCEPTION WHEN undefined_table THEN
  NULL;
WHEN undefined_column THEN
  NULL;
END $$;

-- Drop legacy sequence if exists
DO $$
BEGIN
  EXECUTE 'DROP SEQUENCE IF EXISTS "User_id_seq"';
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Change Favorite.userId to text
DO $$
BEGIN
  EXECUTE 'ALTER TABLE "Favorite" ALTER COLUMN "userId" TYPE text USING "userId"::text';
EXCEPTION WHEN undefined_table THEN
  NULL;
WHEN undefined_column THEN
  NULL;
END $$;

-- Recreate FK with CASCADE
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
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;