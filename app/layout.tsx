/* path: app/layout.tsx */
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { I18nProvider } from '../components/I18nProvider';
import TwaBootstrap from '../components/TwaBootstrap';
import GlobalSafeTop from '../components/GlobalSafeTop';
import TMAInit from '../components/TMAInit';

import ru from '../i18n/messages/ru';
import en from '../i18n/messages/en';
import uk from '../i18n/messages/uk';
import kk from '../i18n/messages/kk';
import tr from '../i18n/messages/tr';
import az from '../i18n/messages/az';
import ka from '../i18n/messages/ka';
import hy from '../i18n/messages/hy';

const dicts: Record<string, any> = { ru, en, uk, kk, tr, az, ka, hy };

/** Всегда тёмная тема + правильный цвет статус-бара */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b1220',
};

export const metadata: Metadata = {
  title: 'Juristum',
  description: 'Юридический ассистент',
  themeColor: '#0b1220',
  other: {
    'color-scheme': 'dark',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get?.('locale')?.value ?? 'ru').toLowerCase();
  const messages = dicts[locale] ?? dicts['ru'];

  return (
    <html lang={locale} data-theme="dark">
      <head>
        {/* Жёстко фиксируем тёмный UI и статус-бар */}
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0b1220" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body style={{ background: '#0b1220', color: '#e5e7eb' }}>
        {/* Глобальный фон */}
        <div className="lm-bg" />

        {/* Безопасная зона под хедер TWA */}
        <GlobalSafeTop />

        {/* Инициализация Telegram WebApp: ready()+expand() */}
        <TMAInit />

        {/* Контент приложения */}
        <div className="lm-page">
          {/* Глобальная инициализация TWA + i18n */}
          <TwaBootstrap>
            <I18nProvider messages={messages}>{children}</I18nProvider>
          </TwaBootstrap>
        </div>
      </body>
    </html>
  );
}
