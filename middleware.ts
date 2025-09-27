import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // A) Для API: прокидываем единый заголовок initData
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);
    const tgHeader = requestHeaders.get('x-telegram-init-data');
    const legacyHeader = requestHeaders.get('x-init-data');
    if (!tgHeader && legacyHeader) {
      requestHeaders.set('x-telegram-init-data', legacyHeader);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // B) Онбординг один раз: '/' -> '/country' -> '/home'
  const welcomed = req.cookies.get('welcomed')?.value === '1';
  const isOnboarding = pathname === '/' || pathname === '/country';

  // Если онбординг ещё не пройден — принудительно ведём на первый шаг '/'
  if (!welcomed && !isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = search; // сохраняем query (?id= и т.п.)
    return NextResponse.redirect(url);
  }

  // Если онбординг уже пройден — не даём застрять на шагах
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
