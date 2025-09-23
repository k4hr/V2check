-- Таблица дел
CREATE TABLE IF NOT EXISTS "cases" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  "next_due_at" TIMESTAMP(3),

  CONSTRAINT "cases_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "cases_userId_idx" ON "cases"("userId");
CREATE INDEX IF NOT EXISTS "cases_status_idx"  ON "cases"("status");
CREATE INDEX IF NOT EXISTS "cases_next_due_at_idx" ON "cases"("next_due_at");

-- Таблица элементов дела
CREATE TABLE IF NOT EXISTS "case_items" (
  "id" TEXT PRIMARY KEY,
  "caseId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,             -- note | step | deadline | doc
  "title" TEXT NOT NULL,
  "body" TEXT,
  "dueAt" TIMESTAMP(3),
  "done" BOOLEAN NOT NULL DEFAULT FALSE,
  "priority" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT "case_items_caseId_fkey"
    FOREIGN KEY ("caseId") REFERENCES "cases"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "case_items_caseId_idx" ON "case_items"("caseId");
CREATE INDEX IF NOT EXISTS "case_items_kind_idx"   ON "case_items"("kind");
CREATE INDEX IF NOT EXISTS "case_items_dueAt_idx"  ON "case_items"("dueAt");
