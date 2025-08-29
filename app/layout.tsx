"use client";

import "./globals.css";
import { PT_Serif } from "next/font/google";

const ptSerif = PT_Serif({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "Juristum",
  description: "Юридическое приложение",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={ptSerif.className}>{children}</body>
    </html>
  );
}
