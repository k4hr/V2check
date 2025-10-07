// app/layout.tsx
import './globals.css';
import { cookies } from 'next/headers';
import { I18nProvider } from '../components/I18nProvider';
import TwaBootstrap from '../components/TwaBootstrap';
import GlobalSafeTop from '../components/GlobalSafeTop';

import ru from '../i18n/messages/ru';
import en from '../i18n/messages/en';
import uk from '../i18n/messages/uk';
import kk from '../i18n/messages/kk';
import tr from '../i18n/messages/tr';
import az from '../i18n/messages/az';
import ka from '../i18n/messages/ka';
import hy from '../i18n/messages/hy';

const dicts: Record<string, any> = { ru, en, uk, kk, tr, az, ka, hy };

export const viewport = { width: 'device-width', initialScale: 1 };
export const metadata = { title: 'Juristum', description: 'Юридический ассистент' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = (cookieStore.get?.('locale')?.value ?? 'ru').toLowerCase();
  const messages = dicts[locale] ?? dicts['ru'];

  return (
    <html lang={locale}>
      <body>
        {/* Глобальный фон */}
        <div className="lm-bg" />
        {/* Глобальная безопасная зона для Telegram-хедера */}
        <GlobalSafeTop />
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
