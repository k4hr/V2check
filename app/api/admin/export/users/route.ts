/* path: app/api/admin/export/users/route.ts */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function parseTgIdFromInitData(init: string | null): string | null {
  try {
    if (!init) return null;
    const sp = new URLSearchParams(init);
    const raw = sp.get('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    const id = u?.id ?? u?.user?.id;
    return id ? String(id) : null;
  } catch { return null; }
}

function isAdmin(tgId: string | null): boolean {
  const list = (process.env.ADMIN_TG_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return !!(tgId && list.includes(tgId));
}

export async function GET(req: Request) {
  try {
    // проверяем админа
    const headerInit = req.headers.get('x-init-data');
    // (на всякий случай поддержим ?init=... из браузера)
    const url = new URL(req.url);
    const qsInit = url.searchParams.get('init');
    const adminId = parseTgIdFromInitData(headerInit || qsInit);
    if (!isAdmin(adminId)) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 401 });
    }

    // просто берём все записи, без not:null (поле non-nullable)
    const rows = await prisma.user.findMany({
      select: { telegramId: true },
      orderBy: { id: 'asc' },
      take: 200_000,
    });

    // на всякий — фильтруем пустые строки/мусор
    const ids = rows
      .map(r => r.telegramId)
      .filter(v => typeof v === 'string' && v.trim() !== '');

    const body = ids.join('\n');

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users-all.txt"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
