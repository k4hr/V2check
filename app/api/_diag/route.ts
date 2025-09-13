// app/api/_diag/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: string };

async function safe<T>(p: Promise<T>): Promise<Ok<T> | Err> {
  try {
    const data = await p;
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

export async function GET() {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'empty',
    BOT_TOKEN: process.env.BOT_TOKEN ? 'set' : 'empty',
    TG_PROVIDER_TOKEN: process.env.TG_PROVIDER_TOKEN ? 'set' : 'empty',
  };

  let db: Ok<any> | Err;
  try {
    const { prisma } = await import('@/lib/prisma');
    db = await safe(prisma.$queryRawUnsafe('SELECT NOW()'));
  } catch (e: any) {
    db = { ok: false, error: e?.message || String(e) };
  }

  let telegram: Ok<any> | Err;
  try {
    const token = process.env.BOT_TOKEN ?? '';
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: ctrl.signal });
    clearTimeout(t);
    telegram = await safe(res.json() as any);
  } catch (e: any) {
    telegram = { ok: false, error: e?.message || String(e) };
  }

  return NextResponse.json({ ok: true, env, checks: { db, telegram } });
}
