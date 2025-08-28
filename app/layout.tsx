export const metadata = { title: 'PravoGo — Библиотека законов' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return (
    <html lang="ru">
      <body style={{background:'#0b0c0f',color:'#e7e7e7',fontFamily:'-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif'}}>
        {children}
      </body>
    </html>
  );
}