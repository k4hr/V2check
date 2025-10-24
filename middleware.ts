import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function withFrameHeaders(res: NextResponse) {
  // В iframe VK Mini Apps нужен frame-ancestors с *.vk.com/*.vk.ru (m.vk.com сюда тоже входит)
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
  // Сервер видит только origin реферера (Referrer-Policy уже стоит).
  // Этого достаточно, чтобы понять, что приходим из VK (включая m.vk.com).
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

  // Доп. признак: пришли из VK (m.vk.com/new.vk.com/vk.com)
  const fromVk = isVkReferrer(req);

  // Считаем пользователя «поприветствованным», если:
  // - уже есть кука welcomed=1
