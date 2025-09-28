// app/pro-plus/plan/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';

export default function PlanHub() {
  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  // подхватываем debug id, если есть
  const debugId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? id : '';
    } catch {
      return '';
    }
  }, []);

  const hrefLaunch =
    debugId
      ? { pathname: '/pro-plus/plan/launch' as const, query: { id: debugId } }
      : '/pro-plus/plan/launch';

  const hrefAnalysis =
    debugId
      ? { pathname: '/pro-plus/plan/analysis' as const, query: { id: debugId } }
      : '/pro-plus/plan/analysis';

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      {/* Назад */}
      <button
        type="button"
        onClick={() => (history.length > 1 ? history.back() : (location.href = '/home'))}
        className="list-btn"
        style={{ maxWidth: 120, marginBottom: 12 }}
      >
        ← Назад
      </button>

      <h1 style={{ textAlign: 'center' }}>Бизнес-план Pro+</h1>
      <p style={{ textAlign: 'center', opacity: .7, marginTop: 6 }}>
        Выберите режим: быстрый запуск или анализ/продвижение.
      </p>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Link href={hrefLaunch} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🚀</span>
            <b>Запуск — стратегический чат</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={hrefAnalysis} className="list-btn" style={{ textDecoration: 'none' }}>
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
