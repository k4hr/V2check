// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.vk.com https://*.vk.ru https://vk.com https://vk.ru"
  );
  res.headers.delete('X-Frame-Options');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

function canonicalizeVkParams(sp: URLSearchParams): string {
  const entries = Array.from(sp.entries())
    .filter(([k]) => k.startsWith('vk_') || k === 'sign');
  const withoutSign = entries.filter(([k]) => k !== 'sign');
  withoutSign.sort(([a], [b]) => a.localeCompare(b));
  const qs = withoutSign.map(([k, v]) => `${k}=${v}`).join('&');
  const sign = sp.get('sign');
  return sign ? (qs ? `${qs}&sign=${sign}` : `sign=${sign}`) : qs;
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const search = req.nextUrl.search;

  // ---------- API ----------
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);

    // нормализуем варианты заголовков от клиента
    const tgHeader =
      requestHeaders.get('x-telegram-init-data') ||
      requestHeaders.get('x-tg-init-data') ||
      requestHeaders.get('X-Telegram-Init-Data') ||
      requestHeaders.get('X-Tg-Init-Data') ||
      '';

    const legacyHeader = requestHeaders.get('x-init-data');
    if (!tgHeader && legacyHeader) {
      requestHeaders.set('x-telegram-init-data', legacyHeader);
    } else if (tgHeader) {
      requestHeaders.set('x-telegram-init-data', tgHeader);
    }

    // X-Vk-Params — из заголовка или из куки
    if (!requestHeaders.get('x-vk-params')) {
      const fromCookie = req.cookies.get('vk_params')?.value;
      if (fromCookie) requestHeaders.set('x-vk-params', fromCookie);
    } else {
      // нормализуем регистр
      const v = requestHeaders.get('x-vk-params')!;
      requestHeaders.set('x-vk-params', v);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  // ---------- Страницы ----------
  const isOnboarding = pathname === '/' || pathname === '/country';

  const welcomedCookie = req.cookies.get('welcomed')?.value === '1';
  const welcomedQuery = searchParams.get('welcomed') === '1';
  const hasVkParamsCookie = !!req.cookies.get('vk_params')?.value;
  const welcomed = welcomedCookie || welcomedQuery || hasVkParamsCookie;

  const res = NextResponse.next();

  if ((welcomedQuery || hasVkParamsCookie) && !welcomedCookie) {
    res.cookies.set('welcomed', '1', {
      path: '/',
      httpOnly: false,
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  // Сохраняем vk_* из query (hash сервер не видит)
  const hasVkParamsInQuery = Array.from(searchParams.keys())
    .some((k) => k.startsWith('vk_') || k === 'sign');
  if (hasVkParamsInQuery) {
    const canonical = canonicalizeVkParams(searchParams);
    if (canonical) {
      res.cookies.set('vk_params', canonical, {
        path: '/',
        httpOnly: false,
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 60 * 24,
      });
    }
  }

  if (!welcomed && !isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.search = search;
    return withFrameHeaders(NextResponse.redirect(url));
  }

  if (welcomed && isOnboarding) {
    const url = req.nextUrl.clone();
    url.pathname = '/home';
    url.search = search;
    return withFrameHeaders(NextResponse.redirect(url));
  }

  return withFrameHeaders(res);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
