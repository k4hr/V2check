'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';

export default function Home() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // ?id= для дебага, если открыто без TWA
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
    <main>
      <h1 style={{ textAlign: 'center' }}>LiveManager</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        Умные инструменты на каждый день
      </p>

      <div className="lm-grid" style={{ marginTop: 16 }}>
        {/* 1. ЛК */}
        <Link href={`/cabinet${linkSuffix}` as Route} className="card" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">👤</span>
            <span className="card__title">Личный кабинет</span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* 2. Подписка */}
        <Link href={`/pro${linkSuffix}` as Route} className="card card--pro" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">⭐</span>
            <span className="card__title">Купить подписку <span className="badge">Pro / Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* 3. Функции Pro */}
        <Link href={`/pro/tools${linkSuffix}` as Route} className="card card--pro" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🧰</span>
            <span className="card__title">Функции Pro <span className="badge">Pro</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* 4. Функции Pro+ */}
        <Link href={`/pro-plus/tools${linkSuffix}` as Route} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🚀</span>
            <span className="card__title">Функции Pro+ <span className="badge badge--gold">Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>
    </main>
  );
}
