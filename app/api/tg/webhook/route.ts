// app/api/tg/webhook/route.ts
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  return NextResponse.redirect(new URL('/api/botWebhook', req.url), 307);
}
export async function GET(req: Request) {
  return NextResponse.json({ ok: true, moved: '/api/botWebhook' });
}
