import './globals.css';
import {cookies} from 'next/headers';
import {I18nProvider} from '@/components/I18nProvider';
import ru from '@/i18n/messages/ru';
import en from '@/i18n/messages/en';
import uk from '@/i18n/messages/uk';
import kk from '@/i18n/messages/kk';
import tr from '@/i18n/messages/tr';
import az from '@/i18n/messages/az';
import ka from '@/i18n/messages/ka';
import hy from '@/i18n/messages/hy';

const dicts: Record<string, Record<string,string>> = { ru, en, uk, kk, tr, az, ka, hy };

export default function RootLayout({children}: {children: React.ReactNode}) {
  const cookieStore = cookies();
  const locale = (cookieStore.get('locale')?.value || 'ru').toLowerCase();
  const messages = dicts[locale] || dicts['ru'];
  return (
    <html lang={locale}>
      <body>
        <I18nProvider messages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
