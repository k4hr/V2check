'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

export default function ProPlansPage() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // Пробрасываем ?id= если мини-апп открыто без TWA
  const withId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id') || '';
      return (path: string) => (id ? (`${path}?id=${encodeURIComponent(id)}` as Route) : (path as Route));
    } catch {
      return (path: string) => path as Route;
    }
  }, []);

  return (
    <main>
      {/* Назад */}
      <button
        type="button"
        onClick={() => history.length > 1 ? history.back() : (location.href = '/home')}
        className="card"
        style={{ maxWidth: 140, marginBottom: 12 }}
      >
        ← Назад
      </button>

      <h1 style={{ textAlign: 'center' }}>Выберите подписку</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        Сравните возможности и перейдите к оплате
      </p>

      <div className="lm-grid" style={{ marginTop: 16 }}>
        {/* PRO (min) */}
        <Link href={withId('/pro/min')} className="card card--pro" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🟪</span>
            <span className="card__title">
              LiveManager Pro <span className="badge">быстрый старт</span>
            </span>
          </span>
          <span className="card__chev">›</span>
          <div className="card__desc">
            • Модель: GPT-4o mini<br/>
            • Быстрые ежедневные инструменты<br/>
            • Базовые лимиты
          </div>
        </Link>

        {/* PRO+ (max) */}
        <Link href={withId('/pro/max')} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">✨</span>
            <span className="card__title">
              LiveManager Pro+ <span className="badge badge--gold">максимум</span>
            </span>
          </span>
          <span className="card__chev">›</span>
          <div className="card__desc">
            • Модель: GPT-4o / GPT-4 (усиленная)<br/>
            • Глубокие сценарии и документы<br/>
            • Повышенные лимиты
          </div>
        </Link>
      </div>

      <style jsx>{`
        .card__desc { margin-top: 8px; font-size: 13px; opacity: .8; line-height: 1.35; }
      `}</style>
    </main>
  );
}
