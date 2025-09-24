// app/layout.tsx
import './globals.css';
import { cookies } from 'next/headers';
import { I18nProvider } from '../components/I18nProvider'; // <-- именованный импорт

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
export const metadata = {
  title: 'Juristum',
  description: 'Юридический ассистент',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies(); // Next 15: типизирован как async в твоём сетапе
  const locale = (cookieStore.get?.('locale')?.value ?? 'ru').toLowerCase();
  const messages = dicts[locale] ?? dicts['ru'];

  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
