// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // ---------- A) API: унификация заголовков initData ----------
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);
    const tgHeader = requestHeaders.get('x-telegram-init-data');
    const legacyHeader = requestHeaders.get('x-init-data');

    if (!tgHeader && legacyHeader) {
      requestHeaders.set('x-telegram-init-data', legacyHeader);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ---------- B) Страницы: онбординг языка/страны ----------
  // Нельзя читать localStorage здесь — только cookies.
  const hasLocale  = !!req.cookies.get('locale')?.value;
  const hasCountry = !!req.cookies.get('country')?.value;
  const hasPrefs   = hasLocale && hasCountry;

  // Пусть пользователь может вручную менять выбор на этих страницах
  const isOnboarding = pathname === '/' || pathname.startsWith('/language') || pathname.startsWith('/country');

  // Если выбора нет — ведём на /language (первая страница онбординга)
  if (!hasPrefs && !pathname.startsWith('/language')) {
    const url = req.nextUrl.clone();
    url.pathname = '/language';
    url.search = search; // сохраняем ?id=... и прочие query
    return NextResponse.redirect(url);
  }

  // Если выбор уже есть — не даём «застревать» на онбординге
  if (hasPrefs && isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    url.search = search;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Матчеры: обрабатываем и API (для заголовков), и все страницы, кроме служебных путей
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
