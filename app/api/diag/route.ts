import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function GET(_req: NextRequest) {
  const out: any = { ok:true, env:{}, checks:{} };
  out.env = {
    NODE_ENV: process.env.NODE_ENV,
    APP_ORIGIN: process.env.APP_ORIGIN,
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    BOT_TOKEN: BOT_TOKEN ? 'set' : 'missing',
    TG_PROVIDER_TOKEN: process.env.TG_PROVIDER_TOKEN ? 'set' : 'empty',
  };
  try { out.checks.db = { ok:true, result: await prisma.$queryRawUnsafe('SELECT 1 as ok') }; }
  catch(e:any){ out.checks.db = { ok:false, error:e?.message||String(e) }; }
  try {
    const tg = BOT_TOKEN ? await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`).then(r=>r.json()) : { ok:false, error:'BOT_TOKEN missing' };
    out.checks.telegram = tg;
  } catch(e:any){ out.checks.telegram = { ok:false, error:e?.message||String(e) }; }
  return NextResponse.json(out);
}
