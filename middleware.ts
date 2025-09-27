import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // A) API: унифициируем заголовок initData
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);
    const tgHeader = requestHeaders.get('x-telegram-init-data');
    const legacyHeader = requestHeaders.get('x-init-data');
    if (!tgHeader && legacyHeader) {
      requestHeaders.set('x-telegram-init-data', legacyHeader);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // B) Онбординг один раз: /language -> /country -> /home
  const welcomed = req.cookies.get('welcomed')?.value === '1';
  const isOnboarding = pathname === '/language' || pathname === '/country';

  // Пока не прошли онбординг — ведём на /language
  if (!welcomed && !isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/language';
    url.search = search;
    return NextResponse.redirect(url);
  }

  // Онбординг уже пройден — не застреваем на /language|/country
  if (welcomed && isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    url.search = search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
