'use client';

import Link from 'next/link';
import type { Route } from 'next';          // <-- добавили
import { useEffect, useMemo } from 'react';

export default function BusinessPlanHub() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // id из query (для дебага)
  const id = useMemo(() => {
    try { const u = new URL(window.location.href); return u.searchParams.get('id') || ''; }
    catch { return ''; }
  }, []);

  // Унифицированный helper под typedRoutes
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

      <h1 style={{ textAlign: 'center' }}>Бизнес-план Pro+</h1>
      <p style={{ textAlign: 'center', opacity: .7, marginTop: 6 }}>
        Выберите режим: запуск или анализ/продвижение.
      </p>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Link
          href={to('/home/pro-plus/businesschat/launch' as Route)}
          className="list-btn"
          style={{ textDecoration: 'none' }}
        >
          <span className="list-btn__left">
            <span className="list-btn__emoji">🚀</span>
            <b>Запуск — стратегический чат</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link
          href={to('/home/pro-plus/businesschat/analysis' as Route)}
          className="list-btn"
          style={{ textDecoration: 'none' }}
        >
          <span className="list-btn__left">
            <span className="list-btn__emoji">📈</span>
            <b>Анализ — рынок / УТП / лендинг / контент / лиды</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
