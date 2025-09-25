'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

export default function PlanHub() {
  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  // берём debug id, если запущено без TWA
  const makeHref = useMemo(() => {
    return (preset: 'plan-launch' | 'plan-analysis') => {
      try {
        const u = new URL(window.location.href);
        const id = u.searchParams.get('id') || '';
        const query = new URLSearchParams(id ? { id } : undefined);
        query.set('p', preset);
        return (`/pro-plus-chat?${query.toString()}`) as Route;
      } catch {
        return (`/pro-plus-chat?p=${preset}`) as Route;
      }
    };
  }, []);

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      {/* Назад */}
      <button
        type="button"
        onClick={() => history.length > 1 ? history.back() : (location.href = '/home')}
        className="list-btn"
        style={{ maxWidth: 120, marginBottom: 12 }}
      >
        ← Назад
      </button>

      <h1 style={{ textAlign: 'center' }}>Бизнес-план Pro+</h1>
      <p style={{ textAlign:'center', opacity:.7, marginTop: 6 }}>
        Выберите режим: быстрый запуск или анализ/продвижение.
      </p>

      <div style={{ display:'grid', gap:12, marginTop:16 }}>
        <Link href={makeHref('plan-launch')} className="list-btn" style={{ textDecoration:'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🚀</span>
            <b>Запуск — стратегический чат</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={makeHref('plan-analysis')} className="list-btn" style={{ textDecoration:'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">📈</span>
            <b>Анализ — рынок/УТП/лендинг/контент/лиды</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
