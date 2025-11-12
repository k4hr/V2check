/* path: app/api/admin/export/users/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const BOT_TOKEN = (process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '').trim();
const ADMIN_TG_IDS = String(process.env.ADMIN_TG_IDS || '')
  .split(/[,\s]+/).map(s => s.trim()).filter(Boolean); // список админов через запятую

function getInitData(req: Request): string {
  const url = new URL(req.url);
  const fromHeader = req.headers.get('x-init-data')
    || req.headers.get('x-telegram-init-data')
    || req.headers.get('x-init')
    || '';
  const fromQuery = url.searchParams.get('init') || '';
  const fromCookie = (() => {
    const raw = req.headers.get('cookie') || '';
    const m = raw.match(/(?:^|;\s*)tg_init_data=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  })();
  return fromHeader || fromQuery || fromCookie || '';
}

function verifyTelegramInitData(initData: string) {
  if (!BOT_TOKEN) throw new Error('BOT_TOKEN_NOT_SET');
  // initData — это строка вида "query_id=...&user=...&auth_date=...&hash=..."
  const sp = new URLSearchParams(initData);
  const hash = sp.get('hash') || '';
  if (!hash) throw new Error('HASH_MISSING');

  // собираем data_check_string
  sp.delete('hash');
  const pairs: string[] = [];
  Array.from(sp.keys()).sort().forEach(k => {
    const v = sp.get(k) ?? '';
    pairs.push(`${k}=${v}`);
  });
  const dataCheckString = pairs.join('\n');

  // secret_key = HMAC_SHA256(bot_token, "WebAppData")
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const calc = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const ok = calc === hash;
  if (!ok) throw new Error('INIT_DATA_BAD');
  // вернём user id для проверки админа
  let userId: string | null = null;
  try {
    const u = sp.get('user');
    if (u) userId = String(JSON.parse(u).id);
  } catch {}
  return { userId };
}

function textResponse(filename: string, content: string) {
  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(req: Request) {
  try {
    const init = getInitData(req);
    const { userId } = verifyTelegramInitData(init);

    // проверка на админа (если ENV указан)
    if (ADMIN_TG_IDS.length && (!userId || !ADMIN_TG_IDS.includes(String(userId)))) {
      return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
    }

    // выгружаем всех пользователей (айди, у кого он есть)
    // подстрой под свою схему, поля могут называться иначе
    const users = await prisma.user.findMany({
      where: { telegramId: { not: null } },
      select: { telegramId: true },
      orderBy: { id: 'asc' }, // можно поменять на createdAt, если поле есть
      take: 200000, // чтобы не улететь в бесконечность
    });

    const lines = users
      .map(u => (u.telegramId || '').trim())
      .filter(Boolean);

    const body = lines.join('\n') + (lines.length ? '\n' : '');
    return textResponse('users-all.txt', body);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 400 });
  }
}
