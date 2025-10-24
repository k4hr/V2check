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

// Канонизируем vk_* → "k=v&k2=v2" по алфавиту (без sign)
function canonicalizeVkParams(sp: URLSearchParams): string {
  const entries = Array.from(sp.entries()).filter(([k]) => k.startsWith('vk_') || k === 'sign');
  const withoutSign = entries.filter(([k]) => k !== 'sign');
  withoutSign.sort(([a], [b]) => a.localeCompare(b));
  return withoutSign.map(([k, v]) => `${k}=${v}`).join('&');
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const search = req.nextUrl.search;

  // -------------------- API --------------------
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);

    // TG совместимость
    const tgHeader = requestHeaders.get('x-telegram-init-data');
    const legacyHeader = requestHeaders.get('x-init-data');
    if (!tgHeader && legacyHeader) requestHeaders.set('x-telegram-init-data', legacyHeader);

    // VK: подложим из куки, если нет заголовка
    if (!requestHeaders.get('x-vk-params')) {
      const fromCookie = req.cookies.get('vk_params')?.value;
      if (fromCookie) requestHeaders.set('x-vk-params', fromCookie);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  // -------------------- Страницы --------------------
  const welcomed = req.cookies.get('welcomed')?.value === '1';
  const isOnboarding = pathname === '/' || pathname === '/country';

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

  // Сохраняем vk_* из query в куку (hash сервер не видит)
  const hasVkParams = Array.from(searchParams.keys()).some((k) => k.startsWith('vk_') || k === 'sign');

  const res = NextResponse.next();
  if (hasVkParams) {
    const canonical = canonicalizeVkParams(searchParams);
    if (canonical) {
      // критично: SameSite=None; Secure — иначе в iframe кука не поедет
      res.cookies.set('vk_params', canonical, {
        path: '/',
        httpOnly: false,
        sameSite: 'none',
        secure: true,
        maxAge: 60 * 60 * 24,
      });
    }
  }
  return withFrameHeaders(res);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
