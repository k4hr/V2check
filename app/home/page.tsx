'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type SavedCountry = { code: string; name: string; locale: string };
const STORAGE_KEY = 'jur_country';

export default function Home() {
  const [country, setCountry] = useState<SavedCountry | null>(null);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}

    // читаем выбранную страну
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCountry(JSON.parse(raw));
    } catch {}
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Juristum</h1>

      {/* плашка со страной + сменить */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
        <div style={{
          display: 'inline-flex',
          gap: 8,
          alignItems: 'center',
          padding: '6px 10px',
          border: '1px solid var(--border, #333)',
          borderRadius: 999
        }}>
          <span style={{ opacity: .8, fontSize: 13 }}>
            Страна: <b>{country?.name || 'не выбрана'}</b>
          </span>
          <Link href="/" className="list-btn" style={{ padding: '4px 8px', borderRadius: 8, textDecoration: 'none' }}>
            Сменить
          </Link>
        </div>
      </div>

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

        <Link href="/assistant" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">📚</span>
            <b>Юр-Помощник</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        {/* (если уже сделал) готовые решения */}
        <Link href="/solutions" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">✅</span>
            <b>Готовые решения</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        {/* Pro+ чат ИИ, если у тебя есть этот маршрут */}
        <Link href="/proplus-chat" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🤖</span>
            <b>Pro+ Чат ИИ</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
