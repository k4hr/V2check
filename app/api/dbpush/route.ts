import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { exec } from 'child_process';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || process.env.ADMIN_SECRET || '';

function run(cmd: string) {
  return new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = exec(cmd, { env: process.env }, (error, stdout, stderr) => {
      resolve({ code: error ? (error as any).code ?? 1 : 0, stdout: String(stdout), stderr: String(stderr) });
    });
    setTimeout(() => child.kill(), 5 * 60 * 1000);
  });
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || req.headers.get('x-admin-token') || '';
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: 'FORBIDDEN' }, { status: 403 });
  }
  const strategy = url.searchParams.get('mode') || 'auto';
  const cmds = strategy === 'push'
    ? ['npx prisma db push']
    : ['npx prisma migrate deploy', 'npx prisma db push'];
  const out: any[] = [];
  for (const c of cmds) {
    const r = await run(c);
    out.push({ cmd: c, ...r });
    if (r.code == 0 && c.includes('migrate deploy')) break;
  }
  return NextResponse.json({ ok: true, result: out });
}
