// app/api/admin/patch/add-username/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_KEY = (process.env.ADMIN_KEY || '').trim();

function getAdminKey(req: NextRequest) {
  const h = req.headers.get('x-admin-key');
  if (h) return h.trim();
  const url = new URL(req.url);
  const q = url.searchParams.get('key') || url.searchParams.get('admin') || '';
  return q.trim();
}

export async function POST(req: NextRequest) {
  try {
    const provided = getAdminKey(req);
    if (!ADMIN_KEY) return NextResponse.json({ ok:false, error:'ADMIN_KEY_MISSING' }, { status:500 });
    if (provided !== ADMIN_KEY) return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });

    // Безопасный патч: создаём колонку, если её ещё нет
    const sql = 'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;';
    const r = await prisma.$executeRawUnsafe(sql);

    return NextResponse.json({ ok:true, applied:true, result:r, sql });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}

export const GET = POST;
