// app/api/healthz/route.ts — healthcheck для Railway/Prod
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const res: any = {
    ok: true,
    uptime: process.uptime(),
    env: { node: process.version, hasDbUrl: !!process.env.DATABASE_URL },
    time: new Date().toISOString(),
  };
  return NextResponse.json(res, { status: 200 });
}
