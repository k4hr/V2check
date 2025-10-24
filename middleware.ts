import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  // Разрешаем встраивание в webview VK (включая m.vk.com)
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.vk.com https://*.vk.ru https://vk.com https://vk.ru"
  );
  res.headers.delete('X-Frame-Options'); // конфликтует с CSP
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

// Канонизируем vk_* → "k=v&k2=v2" по алфавиту (без sign)
function canonicalizeVkParams(sp: URLSearchParams): string {
  const entries = Array.from(sp.entries())
    .filter(([k]) => k.startsWith('vk_') || k === 'sign');
  const withoutSign = entries.filter(([k]) => k !== 'sign');
  withoutSign.sort(([a], [b]) => a.localeCompare(b));
  return withoutSign.map(([k, v]) => `${k}=${v}`).join('&');
}

function isVkReferrer(req: NextRequest): boolean {
  const ref = req.headers.get('referer') || req.headers.get('referrer') || '';
  return /\bhttps?:\/\/(?:[^/]+\.)?vk\.(com|ru)\b/i.test(ref);
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const search = req.nextUrl.search;

  // ---------- API ----------
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);

    // TG initData (совместимость со старым заголовком)
    const tgHeader = requestHeaders.get('x-telegram-init-data');
    const legacyHeader = requestHeaders.get('x-init-data');
    if (!tgHeader && legacyHeader) {
      requestHeaders.set('x-telegram-init-data', legacyHeader);
    }

    // VK: если клиент не прислал x-vk-params — подложим из куки
    if (!requestHeaders.get('x-vk-params')) {
      const fromCookie = req.cookies.get('vk_params')?.value;
      if (fromCookie) requestHeaders.set('x-vk-params', fromCookie);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  // ---------- Страницы ----------
  const isOnboarding = pathname === '/' || pathname === '/country';

  const welcomedCookie = req.cookies.get('welcomed')?.value === '1';
  const welcomedQuery = searchParams.get('welcomed') === '1';
  const hasVkParamsCookie = !!req.cookies.get('vk_params')?.value;
  const fromVk = isVkReferrer(req);

  // Считаем «welcomed», если:
  //  - уже есть кука welcomed=1
  //  - или пришёл ?welcomed=1
  //  - или уже есть vk_params
  //  - или видим заход из доменов VK (чтобы не потерять hash на первом редиректе)
  const welcomed = welcomedCookie || welcomedQuery || hasVkParamsCookie || fromVk;

  const res = NextResponse.next();

  // Если есть признак входа из VK/или welcomed=1/или уже есть vk_params — ставим welcomed=1
  if ((welcomedQuery || hasVkParamsCookie || fromVk) && !welcomedCookie) {
    res.cookies.set('welcomed', '1', {
      path: '/',
      httpOnly: false,
      sameSite: 'none', // важно для iframe VK
      secure: true,
      maxAge: 60 * 60 * 24 * 365, // 1 год
    });
  }

  // Сохраняем vk_* из query в куку (hash сервер не видит)
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
        maxAge: 60 * 60 * 24, // сутки
      });
    }
  }

  // Онбординг
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
