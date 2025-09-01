import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'Juristum',
  description: 'Личный кабинет',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}
