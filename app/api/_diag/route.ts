// app/api/_diag/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/** Безопасное маскирование значений */
function mask(v?: string | null, keep = 4) {
  if (!v) return null;
  if (v.length <= keep * 2) return '*'.repeat(v.length);
  return v.slice(0, keep) + '…' + v.slice(-keep);
}

/** Проверка initData по правилам Telegram */
function verifyInitDataLocal(initData: string, botToken: string) {
  if (!initData || !botToken) return { ok: false as const, reason: 'EMPTY' };
  const params = new URLSearchParams(initData);
  const hash = params.get('hash') || '';
  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calc = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');
  if (calc !== hash) return { ok: false as const, reason: 'BAD_SIGNATURE' };

  const userJson = params.get('user');
  let user: any;
  try { if (userJson) user = JSON.parse(userJson); } catch {}
  const telegramId = user?.id ? String(user.id) : undefined;

  return { ok: true as const, telegramId, user, auth_date: params.get('auth_date') };
}

/** Извлечение Telegram ID из разных источников запроса */
function extractTelegram(req: NextRequest) {
  const pieces: Record<string, any> = {};

  // Явный ID в заголовке
  const hdrTid = req.headers.get('x-telegram-id');
  if (hdrTid) pieces.headerTid = String(hdrTid);

  // Заголовок с целым объектом user
  const hdrUser = req.headers.get('x-telegram-user');
  if (hdrUser) {
    pieces.headerUserRawLen = hdrUser.length;
    try {
      const u = JSON.parse(hdrUser);
      if (u?.id) pieces.headerUserId = String(u.id);
    } catch (e) {
      pieces.headerUserParseError = String(e);
    }
  }

  // Куки
  const cookieUser = req.cookies.get('tg_user')?.value;
  if (cookieUser) {
    pieces.cookieUserRawLen = cookieUser.length;
    try {
      const u = JSON.parse(cookieUser);
      if (u?.id) pieces.cookieUserId = String(u.id);
    } catch (e) {
      pieces.cookieUserParseError = String(e);
    }
  }

  // initData из заголовка/квери/куки
  const initData =
    req.headers.get('x-telegram-init-data') ??
    req.nextUrl.searchParams.get('initData') ??
    req.cookies.get('tg_init_data')?.value ??
    '';
  if (initData) {
    const botToken = process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN || '';
    const v = verifyInitDataLocal(initData, botToken);
    pieces.initDataPresent = true;
    pieces.initDataVerified = v.ok;
    pieces.initDataReason = v.ok ? undefined : v.reason;
    if (v.ok && v.telegramId) pieces.initDataId = String(v.telegramId);
  } else {
    pieces.initDataPresent = false;
  }

  // Ручной хак через ?tid=
  const qTid = req.nextUrl.searchParams.get('tid');
  if (qTid) pieces.queryTid = String(qTid);

  // Выбираем «лучший» источник
  let resolved: string | null = null;
  let from: string | null = null;

  if (pieces.headerTid)         { resolved = pieces.headerTid;      from = 'header:x-telegram-id'; }
  else if (pieces.headerUserId) { resolved = pieces.headerUserId;    from = 'header:x-telegram-user'; }
  else if (pieces.initDataId)   { resolved = pieces.initDataId;      from = 'initData'; }
  else if (pieces.cookieUserId) { resolved = pieces.cookieUserId;    from = 'cookie:tg_user'; }
  else if (pieces.queryTid)     { resolved = pieces.queryTid;        from = 'query:tid'; }

  return { resolved, from, pieces };
}

export async function GET(req: NextRequest) {
  const h = req.headers;
  const cHost   = h.get('host');
  const xfHost  = h.get('x-forwarded-host');
  const xfProto = h.get('x-forwarded-proto');

  // Сбор сведений об окружении
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL_present: Boolean(process.env.DATABASE_URL),
    BOT_TOKEN_present: Boolean(process.env.TG_BOT_TOKEN || process.env.BOT_TOKEN),
    DATABASE_URL_masked: mask(process.env.DATABASE_URL || ''),
  };

  // Кто к нам пришёл (по Telegram)
  const auth = extractTelegram(req);

  // Попытка коннекта к БД и чтение данных
  const db: any = { ok: false, errors: {}, columns: null, user: null, favoritesCount: null };
  try {
    await prisma.$queryRaw`SELECT 1`;
    db.ok = true;
  } catch (e: any) {
    db.errors.connect = String(e?.message ?? e);
  }

  // Какие колонки реально есть у таблицы User
  try {
    db.columns = await prisma.$queryRawUnsafe(
      `SELECT column_name, data_type 
         FROM information_schema.columns
        WHERE table_schema='public' AND table_name='User'
        ORDER BY ordinal_position`
    );
  } catch (e: any) {
    db.errors.columns = String(e?.message ?? e);
  }

  // Ищем запись текущего пользователя (если удалось извлечь его ID)
  if (auth.resolved) {
    try {
      db.user = await prisma.user.findUnique({
        where: { telegramId: String(auth.resolved) },
        select: {
          id: true,
          telegramId: true,
          subscriptionUntil: true,
          // на случай старого поля
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      if (db.user?.id) {
        db.favoritesCount = await prisma.favorite.count({ where: { userId: db.user.id } });
      }
    } catch (e: any) {
      db.errors.user = String(e?.message ?? e);
    }
  }

  // Упрощённые заголовки/куки (без лишнего)
  const requestInfo = {
    url: req.nextUrl.toString(),
    method: req.method,
    headers: {
      host: cHost,
      'x-forwarded-host': xfHost,
      'x-forwarded-proto': xfProto,
      'x-telegram-id': h.get('x-telegram-id') ? '[present]' : undefined,
      'x-telegram-user': h.get('x-telegram-user') ? '[present]' : undefined,
      'x-telegram-init-data': h.get('x-telegram-init-data') ? '[present]' : undefined,
    },
    cookies: {
      tg_user: req.cookies.get('tg_user') ? '[present]' : undefined,
      tg_init_data: req.cookies.get('tg_init_data') ? '[present]' : undefined,
    },
    searchParams: Object.fromEntries(req.nextUrl.searchParams),
  };

  const payload = {
    ok: true,
    env,
    request: requestInfo,
    auth,  // resolved / from / pieces (какой источник сработал)
    db,
    hint: 'Добавь ?tid=<yourTelegramId>&v=1 если открываешь не из Telegram.',
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
