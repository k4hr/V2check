/* path: app/layout.tsx */
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { I18nProvider } from '../components/I18nProvider';
import TwaBootstrap from '../components/TwaBootstrap';
import GlobalSafeTop from '../components/GlobalSafeTop';
import TMAInit from '../components/TMAInit';
import VKBootstrap from '../components/VKBootstrap';

import ru from '../i18n/messages/ru';
import en from '../i18n/messages/en';
import uk from '../i18n/messages/uk';
import kk from '../i18n/messages/kk';
import tr from '../i18n/messages/tr';
import az from '../i18n/messages/az';
import ka from '../i18n/messages/ka';
import hy from '../i18n/messages/hy';

const dicts: Record<string, any> = { ru, en, uk, kk, tr, az, ka, hy };

/** Всегда СВЕТЛАЯ тема + отключаем масштабирование (iOS zoom fix) */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#F5F7FA',
};

export const metadata: Metadata = {
  title: 'Juristum',
  description: 'Юридический ассистент',
  themeColor: '#F5F7FA',
  other: {
    'color-scheme': 'light',
    'apple-mobile-web-app-status-bar-style': 'default', // светлая статус-бар тема
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get?.('locale')?.value ?? 'ru').toLowerCase();
  const messages = dicts[locale] ?? dicts['ru'];

  return (
    <html lang={locale} data-theme="light">
      <head>
        {/* Дублируем meta viewport для совместимости с WebView VK/Telegram */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#F5F7FA" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/* Шрифты: Manrope (основной), Montserrat (для геро-плашки/CHATGPT 5) */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Montserrat:wght@700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ background: '#F5F7FA', color: '#0B0C10' }}>
        {/* Глобальный фон (светлые ауры) */}
        <div className="lm-bg" />

        {/* Безопасная зона под хедер TWA */}
        <GlobalSafeTop />

        {/* Инициализация Telegram WebApp: ready()+expand() */}
        <TMAInit />

        {/* Контент приложения (обёрнут в VKBootstrap) */}
        <VKBootstrap>
          <div className="lm-page">
            {/* Глобальная инициализация TWA + i18n */}
            <TwaBootstrap>
              <I18nProvider messages={messages}>{children}</I18nProvider>
            </TwaBootstrap>
          </div>
        </VKBootstrap>
      </body>
    </html>
  );
}
