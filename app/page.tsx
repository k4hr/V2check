'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Juristum</h1>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Link href="/cabinet" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">👤</span>
            <b>Личный кабинет</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href="/pro" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">⭐</span>
            <b>Купить подписку</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        {/* БЫЛО: href="/library" — теперь ведём на ассистента */}
        <Link href="/assistant" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">📚</span>
            <b>Юр-Помощник</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
