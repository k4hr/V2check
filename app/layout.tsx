export const metadata = { title: 'Juristum — библиотека законов' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="ru">
      <body style={{background:'#0f1114',color:'#e7e7e7',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif'}}>
        {children}
      </body>
    </html>
  );
}