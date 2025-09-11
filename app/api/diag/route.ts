import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';

export async function GET(req: NextRequest) {
  const out: any = { ok: true, checks: {} };

  // 1. ENV (безопасные куски)
  out.env = {
    NODE_ENV: process.env.NODE_ENV,
    APP_ORIGIN: process.env.APP_ORIGIN,
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'missing',
    BOT_TOKEN: BOT_TOKEN ? 'set' : 'missing',
    TG_PROVIDER_TOKEN: process.env.TG_PROVIDER_TOKEN ? 'set' : 'empty',
  };

  // 2. Prisma ping
  try {
    const r = await prisma.$queryRawUnsafe(`SELECT 1 as ok`);
    out.checks.db = { ok: true, result: r };
  } catch (e: any) {
    out.checks.db = { ok: false, error: e?.message || String(e) };
  }

  // 3. Telegram getMe
  try {
    if (BOT_TOKEN) {
      const tg = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
      const data = await tg.json().catch(() => null);
      out.checks.telegram = data;
    } else {
      out.checks.telegram = { ok: false, error: 'BOT_TOKEN missing' };
    }
  } catch (e: any) {
    out.checks.telegram = { ok: false, error: e?.message || String(e) };
  }

  // 4. Prisma версия
  try {
    const pkg = require('@prisma/client/package.json');
    out.prisma = {
      version: pkg.version,
      binaryTargets: (pkg?.prisma?.client?.generator?.binaryTargets) || 'n/a',
    };
  } catch {
    out.prisma = { version: 'unknown' };
  }

  return NextResponse.json(out, { status: 200 });
}
