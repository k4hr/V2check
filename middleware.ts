// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  res.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.vk.com https://*.vk.ru https://vk.com https://vk.ru"
  );
  res.headers.delete('X-Frame-Options'); // конфликтует с CSP
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-Content-Type-Options', 'nosniff');
  return res;
}

// Канонизируем vk_* → строку "k=v&k2=v2" (по алфавиту) + sign в конце
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

  // ---------- API: пробрасываем заголовки ----------
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);

    // Telegram initData: нормализуем разные варианты
    const tgHeader =
      requestHeaders.get('x-telegram-init-data') ||
      requestHeaders.get('x-tg-init-data') ||
      requestHeaders.get('X-Telegram-Init-Data') ||
      requestHeaders.get('X-Tg-Init-Data') ||
      requestHeaders.get('x-init-data') || // исторический
      '';
    if (tgHeader) requestHeaders.set('x-telegram-init-data', tgHeader);

    // VK launch params — из заголовка или из куки
    if (!requestHeaders.get('x-vk-params')) {
      const fromCookie = req.cookies.get('vk_params')?.value;
      if (fromCookie) requestHeaders.set('x-vk-params', fromCookie);
    } else {
      requestHeaders.set('x-vk-params', requestHeaders.get('x-vk-params')!);
    }

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return withFrameHeaders(res);
  }

  // ---------- Страницы ----------
  const isOnboarding = pathname === '/' || pathname === '/country';

  // 1) Признаки запуска во фрейме VK
  const referer = req.headers.get('referer') || '';
  const ua = req.headers.get('user-agent') || '';
  const secFetchSite = (req.headers.get('sec-fetch-site') || '').toLowerCase();

  const fromVkRef = /(^https?:\/\/)?([a-z0-9.-]*\.)?vk\.(com|ru)\//i.test(referer);
  const vkUA = /(VK.*App|VKClient|VKB|OKApp|YaBrowser\/.*SearchPartner)/i.test(ua);
  const embeddedCrossSite = secFetchSite === 'cross-site';

  // 2) Наши прежние признаки
  const welcomedCookie    = req.cookies.get('welcomed')?.value === '1';
  const welcomedQuery     = searchParams.get('welcomed') === '1';
  const hasVkParamsCookie = !!req.cookies.get('vk_params')?.value;

  // 3) Считаем визит «приветствованным», если ЛЮБОЕ из условий:
  // - уже есть welcomed=1 (кука/урл)
  // - уже есть vk_params
  // - запрос пришёл как cross-site (мы внутри iframe на чужом домене)
  // - явные признаки VK по рефереру или User-Agent
  const welcomed =
    welcomedCookie ||
    welcomedQuery ||
    hasVkParamsCookie ||
    embeddedCrossSite ||
    fromVkRef ||
    vkUA;

  const res = NextResponse.next();

  // Если есть любой из признаков VK/iframe — ставим welcomed=1 (для следующих переходов)
  if ((welcomedQuery || hasVkParamsCookie || embeddedCrossSite || fromVkRef || vkUA) && !welcomedCookie) {
    res.cookies.set('welcomed', '1', {
      path: '/',
      httpOnly: false,
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 60 * 24 * 365, // 1 год
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
        maxAge: 60 * 60 * 24, // сутки
      });
    }
  }

  // Редиректы онбординга
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
