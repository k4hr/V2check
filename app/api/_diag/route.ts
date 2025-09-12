import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function safe<T>(p: Promise<T>) {
  try { return { ok: true, data: await p }; } catch (e:any) { return { ok:false, error: e?.message || String(e) }; }
}

export async function GET() {
  // ленивый импорт, чтобы не падать при отсутствии БД
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  const env = {
    NODE_ENV: process.env.NODE_ENV || 'unknown',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'empty',
    BOT_TOKEN: process.env.BOT_TOKEN ? 'set' : 'empty',
    TG_PROVIDER_TOKEN: process.env.TG_PROVIDER_TOKEN ? 'set' : 'empty',
  };

  // лёгкая проверка prisma: простой запрос now()
  const db = await safe(prisma.$queryRawUnsafe('SELECT NOW()'));

  // лёгкая проверка бота: getMe с таймаутом
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), 4000);
  const bot = await safe(fetch(
    `https://api.telegram.org/bot${process.env.BOT_TOKEN || 'x'}/getMe`,
    { signal: ctrl.signal }
  ).then(r=>r.json()));
  clearTimeout(t);

  return NextResponse.json({ ok:true, env, checks: { db, telegram: bot } }, { status: 200 });
}
