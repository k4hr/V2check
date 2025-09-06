// lib/auth/index.ts
import { NextRequest } from 'next/server';

function readTgUserFromReq(req: NextRequest): any | null {
  const q = req.nextUrl?.searchParams?.get('tg_user');
  if (q) { try { return JSON.parse(q); } catch {} }

  const h = req.headers.get('x-telegram-user');
  if (h) { try { return JSON.parse(h); } catch {} }

  const c = req.cookies.get('tg_user')?.value;
  if (c) { try { return JSON.parse(c); } catch {} }

  return null;
}

export async function getTelegramId(req: NextRequest): Promise<string | null> {
  const u = readTgUserFromReq(req);
  const id = u?.id ?? u?.user?.id;
  return id ? String(id) : null;
}

export async function getTelegramIdStrict(req: NextRequest): Promise<string> {
  const id = await getTelegramId(req);
  if (!id) throw new Error('TELEGRAM_ID_NOT_FOUND');
  return id;
}
