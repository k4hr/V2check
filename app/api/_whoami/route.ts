import { NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest) {
  const id =
    req.headers.get('x-telegram-id') ||
    req.nextUrl.searchParams.get('tid') ||
    (() => {
      try {
        const raw = req.cookies.get('tg_user')?.value;
        if (raw) { const u = JSON.parse(raw); return u?.id ? String(u.id) : null; }
      } catch {}
      return null;
    })();

  return NextResponse.json({ ok: Boolean(id), telegramId: id ?? null });
}
