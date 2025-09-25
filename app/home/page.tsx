'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

export default function Home() {
  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  // тащим debug id из URL, если запущено без TWA
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch {
      return '';
    }
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Juristum</h1>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Link href={`/cabinet${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">👤</span>
            <b>Личный кабинет</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={`/pro${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">⭐</span>
            <b>Купить подписку</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={`/assistant${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">📚</span>
            <b>Юр-Помощник</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={`/templates${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🧩</span>
            <b>Готовые решения</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={`/pro-plus-chat${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🤖</span>
            <b>Pro+ Чат ИИ</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        {/* Новые инструменты Pro+ */}
        <Link href={`/pro-plus/plan${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🚀</span>
            <b>Бизнес-план <span style={{ color:'#5b8cff' }}>Pro+</span></b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={`/pro-plus/resume${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🧾</span>
            <b>Резюме <span style={{ color:'#5b8cff' }}>Pro+</span></b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
