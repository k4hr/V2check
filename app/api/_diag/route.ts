// app/api/_diag/route.ts
import { NextResponse } from 'next/server';

type Ok<T> = { ok: true; result: T };
type Err = { ok: false; error: string };

async function safe<T>(p: Promise<T>): Promise<Ok<T> | Err> {
  try { const v = await p; return { ok: true, result: v }; }
  catch (e: any) { return { ok: false, error: e?.message || String(e) }; }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'empty',
    BOT_TOKEN: process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN ? 'set' : 'empty',
    TG_PROVIDER_TOKEN: process.env.TG_PROVIDER_TOKEN ? 'set' : 'empty',
  };

  // DB check
  let db: Ok<any> | Err;
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    db = await safe(prisma.$queryRawUnsafe('SELECT NOW()'));
  } catch (e: any) { db = { ok: false, error: e?.message || String(e) }; }

  // Telegram getMe check
  let telegram: Ok<any> | Err;
  try {
    const token = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    telegram = await safe(res.json());
  } catch (e: any) { telegram = { ok: false, error: e?.message || String(e) }; }

  return NextResponse.json({ ok: true, env, checks: { db, telegram } });
}
