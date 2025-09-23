import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
export const dynamic = 'force-dynamic';

const prisma = (globalThis as any).__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).__prisma__ = prisma;

export async function GET(req: NextRequest) {
  try {
    // создадим таблицы, если их нет (быстрый фикс)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.cases (
        id            text PRIMARY KEY,
        "userId"      text NOT NULL,
        title         text NOT NULL,
        status        text NOT NULL DEFAULT 'active',
        "createdAt"   timestamptz NOT NULL DEFAULT now(),
        "updatedAt"   timestamptz NOT NULL DEFAULT now(),
        next_due_at   timestamptz NULL
      );
      CREATE INDEX IF NOT EXISTS cases_userId_idx ON public.cases("userId");
      CREATE INDEX IF NOT EXISTS cases_status_idx ON public.cases(status);
      CREATE INDEX IF NOT EXISTS cases_next_due_at_idx ON public.cases(next_due_at);

      CREATE TABLE IF NOT EXISTS public.case_items (
        id            text PRIMARY KEY,
        "caseId"      text NOT NULL,
        kind          text NOT NULL,
        title         text NOT NULL,
        body          text NULL,
        "dueAt"       timestamptz NULL,
        done          boolean NOT NULL DEFAULT false,
        priority      integer NULL,
        "createdAt"   timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS case_items_caseId_idx ON public.case_items("caseId");
      CREATE INDEX IF NOT EXISTS case_items_kind_idx ON public.case_items(kind);
      CREATE INDEX IF NOT EXISTS case_items_dueAt_idx ON public.case_items("dueAt");

      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'case_items_caseId_fkey'
        ) THEN
          ALTER TABLE public.case_items
            ADD CONSTRAINT case_items_caseId_fkey
            FOREIGN KEY ("caseId") REFERENCES public.cases(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    return NextResponse.json({ ok: true, bootstrapped: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'INTERNAL', code: e?.code, message: e?.message }, { status: 500 });
  }
}
