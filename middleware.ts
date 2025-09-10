// v2check/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Унификация заголовков initData:
 * - если клиент прислал только x-init-data, то прокинем x-telegram-init-data.
 * Это автоматически починит все ваши API-ручки, которые ждут x-telegram-init-data.
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  // Применяем только к /api/*
  if (!url.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  const tgHeader = requestHeaders.get('x-telegram-init-data');
  const legacyHeader = requestHeaders.get('x-init-data');

  if (!tgHeader && legacyHeader) {
    requestHeaders.set('x-telegram-init-data', legacyHeader);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/api/:path*'],
};
