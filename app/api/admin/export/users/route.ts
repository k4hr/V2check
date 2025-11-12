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
  const list = (process.env.ADMIN_TG_IDS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  return !!(tgId && list.includes(tgId));
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get('format') || 'txt').toLowerCase();

    // можно передать через заголовок x-init-data или ?init=
    const init = req.headers.get('x-init-data') || url.searchParams.get('init') || null;
    if (!isAdmin(parseAdminId(init))) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 401 });
    }

    // Флаг «добрать возможных стартеров» по lastSeenAt (если когда-то потеряли события /start)
    const backfill =
      (process.env.MAYBE_BACKFILL_START || '').toLowerCase() === '1' ||
      (process.env.MAYBE_BACKFILL_START || '').toLowerCase() === 'true';

    // 1) Явные стартеры: есть StartEvent ИЛИ поле startedAt
    const startedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { startedAt: { not: null } },
          { startEvents: { some: {} } },
        ],
      },
      select: { telegramId: true },
      orderBy: { telegramId: 'asc' },
      take: 500_000,
    });

    // 2) Доп. добор (опционально): нет startedAt и нет StartEvent, но есть lastSeenAt
    let extra: { telegramId: string }[] = [];
    if (backfill) {
      extra = await prisma.user.findMany({
        where: {
          startedAt: null,
          startEvents: { none: {} },
          lastSeenAt: { not: null },
        },
        select: { telegramId: true },
        orderBy: { telegramId: 'asc' },
        take: 500_000,
      });
    }

    // объединяем и уникализируем
    const set = new Set<string>();
    for (const u of startedUsers) set.add(u.telegramId);
    for (const u of extra) set.add(u.telegramId);
    const all = Array.from(set).sort((a, b) => a.localeCompare(b));

    if (format === 'json') {
      return NextResponse.json({ ok: true, count: all.length, users: all.map(telegramId => ({ telegramId })) });
    }

    const body = all.join('\n') + (all.length ? '\n' : '');
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users-started.txt"',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
