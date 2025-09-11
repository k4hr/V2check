-- prisma/hotfix/2025-09-11_add_defaults.sql
-- Безопасный хотфикс в прод-Postgres (Railway).
-- Добавляем/исправляем обязательные updatedAt с дефолтом,
-- проставляем значения там, где NULL.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "User" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "User"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "Favorite"
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3);
UPDATE "Favorite" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "Favorite"
  ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "updatedAt" SET NOT NULL;
