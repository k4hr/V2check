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
      {/* Шапка */}
      <h1 style={{ textAlign: 'center' }}>LiveManager</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        Умные инструменты на каждый день
      </p>

      {/* Карточки-линки */}
      <div className="lm-grid" style={{ marginTop: 16 }}>
        <Link href={`/cabinet${linkSuffix}` as Route} className="card" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">👤</span>
            <span className="card__title">Личный кабинет</span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={`/pro${linkSuffix}` as Route} className="card card--pro" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">⭐</span>
            <span className="card__title">Купить подписку <span className="badge">Pro / Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={`/assistant${linkSuffix}` as Route} className="card" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">📚</span>
            <span className="card__title">Юр-Помощник</span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={`/templates${linkSuffix}` as Route} className="card" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🧩</span>
            <span className="card__title">Готовые решения</span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={`/pro-plus-chat${linkSuffix}` as Route} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🤖</span>
            <span className="card__title">Pro+ Чат ИИ <span className="badge badge--gold">Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={`/pro-plus/plan${linkSuffix}` as Route} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🚀</span>
            <span className="card__title">Бизнес-план <span className="badge badge--gold">Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={`/pro-plus/resume${linkSuffix}` as Route} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🧾</span>
            <span className="card__title">Резюме <span className="badge badge--gold">Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>
    </main>
  );
}
