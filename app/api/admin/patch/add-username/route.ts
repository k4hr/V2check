// app/api/admin/patch/add-username/route.ts
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
    if (!ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'ADMIN_KEY_MISSING' }, { status: 500 });
    }
    const provided = getAdminKey(req);
    if (provided !== ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    // Разовый безопасный патч: добавляем колонку username, если её нет
    const sql = 'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;';
    const result = await prisma.$executeRawUnsafe(sql);

    return NextResponse.json({ ok: true, applied: true, result, sql });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

// GET для удобного вызова из браузера
export const GET = POST;
