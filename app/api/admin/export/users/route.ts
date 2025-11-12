/* path: app/api/admin/export/users/route.ts */
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseAdminId(init: string | null) {
  try {
    if (!init) return null;
    const sp = new URLSearchParams(init);
    const u = sp.get('user');
    if (!u) return null;
    const j = JSON.parse(u);
    return j?.id ? String(j.id) : null;
  } catch { return null; }
}
function isAdmin(tgId: string | null) {
  const list = (process.env.ADMIN_TG_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
  return !!(tgId && list.includes(tgId));
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get('format') || 'txt').toLowerCase();
    // поддерживаем и заголовок, и query-параметр
    const init = req.headers.get('x-init-data') || url.searchParams.get('init') || null;
    if (!isAdmin(parseAdminId(init))) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 401 });
    }

    // Берём только тех, у кого есть хотя бы одно событие /start (StartEvent)
    // Это гарантирует, что выгрузка = «нажали start», а не просто «были в приложении».
    const users = await prisma.user.findMany({
      where: { startEvents: { some: {} } },
      select: { telegramId: true },
      orderBy: { telegramId: 'asc' },
      take: 500_000,
    });

    if (format === 'json') {
      return NextResponse.json({ ok: true, count: users.length, users });
    }

    const body = users.map(u => u.telegramId).join('\n') + (users.length ? '\n' : '');
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users-started.txt"',
      },
    });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
