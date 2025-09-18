'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    try {
      const tg: any = (window as any).Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
      tg?.BackButton?.hide?.();
      // Защита от невидимых перекрывающих слоёв (не меняет дизайн)
      const style = document.createElement('style');
      style.innerHTML = `
        [data-no-click-block="1"] { pointer-events: none !important; }
      `;
      document.head.appendChild(style);
    } catch {}
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Juristum</h1>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Link href="/cabinet" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">👤</span>
            <b>Личный кабинет</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href="/pro" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">⭐</span>
            <b>Купить подписку</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href="/library" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">📚</span>
            <b>Библиотека</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
