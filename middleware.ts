// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  // Разрешаем встраивание во фрейм VK и не ломаем TWA/браузер
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.vk.com https://*.vk.ru https://vk.com https://vk.ru"
  );
  // X-Frame-Options устарел и конфликтует с frame-ancestors — убираем
  res.headers.delete('X-Frame-Options');
  // Нормализуем базовые заголовки безопасности (опционально, но не мешают фреймам)
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

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
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  // B) Онбординг один раз: '/' -> '/country' -> '/home'
  const welcomed = req.cookies.get('welcomed')?.value === '1';
  const isOnboarding = pathname === '/' || pathname === '/country';

  // Если онбординг ещё не пройден — принудительно ведём на первый шаг '/'
  if (!welcomed && !isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = search; // сохраняем query (?id= и т.п.)
    const res = NextResponse.redirect(url);
    return withFrameHeaders(res);
  }

  // Если онбординг уже пройден — не даём застрять на шагах
  if (welcomed && isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    url.search = search;
    const res = NextResponse.redirect(url);
    return withFrameHeaders(res);
  }

  // Обычный проход
  const res = NextResponse.next();
  return withFrameHeaders(res);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
