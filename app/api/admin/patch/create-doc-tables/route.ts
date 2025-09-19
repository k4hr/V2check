// app/api/admin/patch/create-doc-tables/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_SECRET = (process.env.ADMIN_SECRET || '').trim();

export async function GET(req: Request) {
  try {
    if (!ADMIN_SECRET) {
      return NextResponse.json({ ok:false, error:'ADMIN_SECRET_MISSING' }, { status:500 });
    }
    const url = new URL(req.url);
    const sec = (url.searchParams.get('secret') || '').trim();
    if (sec !== ADMIN_SECRET) {
      return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });
    }

    // Создадим Doc и DocVersion, если их нет
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Doc" (
        "id" TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "title" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "sourceUrl" TEXT,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DocVersion" (
        "id" TEXT PRIMARY KEY,
        "docId" TEXT NOT NULL,
        "contentHtml" TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "DocVersion_docId_fkey"
          FOREIGN KEY ("docId") REFERENCES "Doc"("id") ON DELETE CASCADE
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DocVersion_docId_idx" ON "DocVersion"("docId");
    `);

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}
