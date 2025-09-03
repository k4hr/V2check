import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { prisma } from '../../../lib/prisma';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const withTables = url.searchParams.get('tables');
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    let tables: any[] | undefined;
    if (withTables) {
      tables = await prisma.$queryRawUnsafe(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY 1
      `) as any[];
    }
    return NextResponse.json({
      ok: true,
      db: process.env.DATABASE_URL ? 'VISIBLE' : 'MISSING',
      tables,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
