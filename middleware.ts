// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // A) API: унификация заголовков initData
  if (pathname.startsWith('/api')) {
    const requestHeaders = new Headers(req.headers);
    const tgHeader = requestHeaders.get('x-telegram-init-data');
    const legacyHeader = requestHeaders.get('x-init-data');
    if (!tgHeader && legacyHeader) {
      requestHeaders.set('x-telegram-init-data', legacyHeader);
    }
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // B) Больше НЕТ обязательного онбординга по стране. Оставляем только locale.
  const hasLocale = !!req.cookies.get('locale')?.value || !!req.cookies.get('NEXT_LOCALE')?.value;

  // Если вдруг ещё остались старые страницы — позволим их открывать вручную,
  // но не будем навязывать редиректы.
  const isLegacyOnboarding =
    pathname === '/language' || pathname === '/country';

  // Если у пользователя нет locale — просто пропускаем (UI сам покажет аккордеон).
  // Никаких редиректов больше не делаем.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next|favicon.ico|assets|public|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|txt|xml)).*)',
  ],
};
