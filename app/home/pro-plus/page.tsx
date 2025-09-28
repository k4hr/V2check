'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

export default function ProPlusHub() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // пробрасываем ?id= если есть (как у тебя в других страницах)
  const id = useMemo(() => {
    try { const u = new URL(window.location.href); return u.searchParams.get('id') || ''; }
    catch { return ''; }
  }, []);

  // Хелпер под typedRoutes: возвращаем UrlObject с Route pathname
  const to = (pathname: Route) =>
    ({ pathname, ...(id ? { query: { id } } : {}) });

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => (history.length > 1 ? history.back() : location.assign('/home'))}
        className="list-btn"
        style={{ maxWidth: 120, marginBottom: 12 }}
      >
        ← Назад
      </button>

      <h1 style={{ textAlign: 'center' }}>Эксперт центр Pro+</h1>
      <p style={{ textAlign: 'center', opacity: .7, marginTop: 6 }}>
        Выберите инструмент
      </p>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {/* Pro+ чат ИИ (юрид.) */}
        <Link
          href={to('/home/pro-plus/urchatgpt' as Route)}
          className="list-btn"
          style={{ textDecoration: 'none' }}
        >
          <span className="list-btn__left">
            <span className="list-btn__emoji">🤖</span>
            <b>Pro+ чат ИИ (юрид.)</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        {/* Бизнес-чат (хаб) */}
        <Link
          href={to('/home/pro-plus/businesschat' as Route)}
          className="list-btn"
          style={{ textDecoration: 'none' }}
        >
          <span className="list-btn__left">
            <span className="list-btn__emoji">💼</span>
            <b>Бизнес-чат: запуск/анализ</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
