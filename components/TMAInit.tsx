'use client';

import { useEffect } from 'react';

export default function TMAInit() {
  useEffect(() => {
    const tg = (window as any)?.Telegram?.WebApp;
    try {
      tg?.ready();   // сообщаем Telegram, что всё отрендерилось
      tg?.expand();  // просим фуллскрин
      // при желании можно:
      // tg?.setHeaderColor('secondary_bg_color');
      // tg?.setBackgroundColor('#0d0f14');
    } catch {
      // молчим, если не в TWA
    }
  }, []);

  return null;
}
