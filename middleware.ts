// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  // Разрешаем встраивание во фрейм VK (и не ломаем браузер/TWA)
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.vk.com https://*.vk.ru https://vk.com https://vk.ru"
  );
  res.headers.delete('X-Frame-Options'); // конфликтует с CSP
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

// Канонизируем vk_* параметры в строку "k=v&k2=v2" по алфавиту (без sign)
function canonicalizeVkParams(sp: URLSearchParams): string {
  const entries = Array.from(sp.entries())
    .filter(([k]) => k.startsWith('vk_') || k === 'sign');
  const withoutSign = entries.filter(([k]) => k !== 'sign');
  withoutSign.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return withoutSign.map(([k, v]) => `${k}=${v}`).join('&');
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const search = req.nextUrl.search;

  // Если на страницах (НЕ /api) пришли vk_* в query — сохраним в куку (hash недоступен на сервере)
  if (!pathname.startsWith('/api')) {
    const hasVkParams = Array.from(searchParams.keys()).some((k) => k.startsWith('vk_') || k === 'sign');
    const res = NextResponse.next();

    if (hasVkParams) {
      const canonical = canonicalizeVkParams(searchParams);
      if (canonical) {
        res.cookies.set('vk_params', canonical, {
          path: '/',
          httpOnly: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // сутки
        });
      }
    }

    return withFrameHeaders(res);
  }

  // Для API — прокидываем заголовки и подсовываем vk_params из куки
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);

    // Telegram заголовок (совместимость с legacy x-init-data)
    const tgHeader = requestHeaders.get('x-telegram-init-data');
    const legacyHeader = requestHeaders.get('x-init-data');
    if (!tgHeader && legacyHeader) {
      requestHeaders.set('x-telegram-init-data', legacyHeader);
    }

    // VK: если клиент не прислал x-vk-params — возьмём из куки
    if (!requestHeaders.get('x-vk-params')) {
      const fromCookie = req.cookies.get('vk_params')?.value;
      if (fromCookie) {
        requestHeaders.set('x-vk-params', fromCookie);
      }
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  // Онбординг как у тебя (оставил как было)
  const welcomed = req.cookies.get('welcomed')?.value === '1';
  const isOnboarding = pathname === '/' || pathname === '/country';

  if (!welcomed && !isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = search; // сохраняем query
    const res = NextResponse.redirect(url);
    return withFrameHeaders(res);
  }

  if (welcomed && isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    url.search = search;
    const res = NextResponse.redirect(url);
    return withFrameHeaders(res);
  }

  const res = NextResponse.next();
  return withFrameHeaders(res);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
