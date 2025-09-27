'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

export default function ProSelectPage() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // тащим ?id= для дебага (если открыто без TWA)
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  return (
    <main className="lm-wrap">
      {/* Назад */}
      <button
        type="button"
        onClick={() => history.length > 1 ? history.back() : (location.href = '/home')}
        className="card"
        style={{ maxWidth: 120, padding: '10px 12px', marginBottom: 12 }}
      >
        ← Назад
      </button>

      <h1 style={{ textAlign: 'center' }}>Выберите подписку</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        Сравните и перейдите к оплате
      </p>

      <div className="lm-grid" style={{ marginTop: 16 }}>
        {/* Pro */}
        <Link
          href={`/pro/min${linkSuffix}` as Route}
          className="card card--pro"
          style={{ textDecoration: 'none' }}
        >
          <span className="card__left">
            <span className="card__icon">📦</span>
            <span>
              <div className="card__title">LiveManager Pro</div>
              <div className="card__subtitle">Попробуй — быстрые ежедневные инструменты</div>
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* Pro+ */}
        <Link
          href={`/pro/max${linkSuffix}` as Route}
          className="card card--proplus"
          style={{ textDecoration: 'none' }}
        >
          <span className="card__left">
            <span className="card__icon">✨</span>
            <span>
              <div className="card__title">LiveManager Pro+</div>
              <div className="card__subtitle">Углубись — продвинутые сценарии и повышенные лимиты</div>
            </span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>

      <style jsx>{`
        .lm-wrap { padding: 20px; max-width: 780px; margin: 0 auto; }
        .lm-subtitle { opacity: .7; margin-top: 6px; }
        .lm-grid { display: grid; gap: 12px; }

        .card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px; border-radius: 14px;
          background: #161b25; border: 1px solid rgba(255,255,255,.08);
          color: inherit; box-shadow: 0 6px 24px rgba(0,0,0,.25);
        }
        .card__left { display: flex; gap: 12px; align-items: center; }
        .card__icon { width: 36px; height: 36px; display: grid; place-items: center; font-size: 20px;
          background: rgba(255,255,255,.06); border-radius: 10px; }
        .card__title { font-weight: 800; font-size: 16px; line-height: 1.1; }
        .card__subtitle { opacity: .75; font-size: 13px; margin-top: 2px; }
        .card__chev { opacity: .6; font-size: 22px; }

        .card--pro {
          border-color: rgba(91,140,255,.35);
          box-shadow: 0 10px 30px rgba(91,140,255,.12);
        }
        .card--proplus {
          border-color: rgba(255,191,73,.35);
          box-shadow: 0 10px 30px rgba(255,191,73,.12);
        }
      `}</style>
    </main>
  );
}
