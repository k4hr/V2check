import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
export const dynamic = 'force-dynamic';

const prisma = (globalThis as any).__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).__prisma__ = prisma;

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1
    `;
    return NextResponse.json({ ok: true, tables: rows.map(r => r.tablename) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: 'INTERNAL', code: e?.code, message: e?.message }, { status: 500 });
  }
}
