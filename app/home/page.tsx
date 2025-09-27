'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';

type Locale = 'ru' | 'en' | 'uk' | 'kk' | 'tr' | 'az' | 'ka' | 'hy';

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский',       flag: '🇷🇺' },
  { code: 'en', label: 'English',       flag: '🇬🇧' },
  { code: 'uk', label: 'Українська',    flag: '🇺🇦' },
  { code: 'kk', label: 'Қазақша',       flag: '🇰🇿' },
  { code: 'tr', label: 'Türkçe',        flag: '🇹🇷' },
  { code: 'az', label: 'Azərbaycanca',  flag: '🇦🇿' },
  { code: 'ka', label: 'ქართული',       flag: '🇬🇪' },
  { code: 'hy', label: 'Հայերեն',       flag: '🇦🇲' },
];

// лёгкий список стран (если нужно расширишь)
const COUNTRIES = [
  { code: 'RU', name: 'Россия', flag: '🇷🇺' },
  { code: 'UA', name: 'Украина', flag: '🇺🇦' },
  { code: 'KZ', name: 'Казахстан', flag: '🇰🇿' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'AZ', name: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'GE', name: 'საქართველო', flag: '🇬🇪' },
  { code: 'AM', name: 'Հայաստան', flag: '🇦🇲' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
];

export default function Home() {
  const [open, setOpen] = useState(false); // аккордеон
  const [saving, setSaving] = useState<string | null>(null);

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

  function setCookie(k: string, v: string) {
    try {
      const maxAge = 60 * 60 * 24 * 365; // 1 год
      document.cookie = `${k}=${encodeURIComponent(v)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
    } catch {}
  }

  function haptic(type: 'light' | 'medium' = 'light') {
    try {
      const tg: any = (window as any).Telegram?.WebApp;
      tg?.HapticFeedback?.impactOccurred?.(type);
    } catch {}
  }

  function changeLocale(code: Locale) {
    if (saving) return;
    setSaving(`locale:${code}`);
    setCookie('locale', code);
    haptic('light');
    // лёгкая задержка чтобы cookie точно записалась
    setTimeout(() => { window.location.reload(); }, 120);
  }

  function changeCountry(code: string) {
    if (saving) return;
    setSaving(`country:${code}`);
    setCookie('country', code);
    haptic('light');
    // страну можно менять без перезагрузки — просто закрываем аккордеон
    setTimeout(() => { setSaving(null); setOpen(false); }, 200);
  }

  return (
    <main>
      {/* Шапка */}
      <h1 style={{ textAlign: 'center' }}>LiveManager</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        Умные инструменты на каждый день
      </p>

      {/* Карточки */}
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
            <span className="card__title">Ежедневные задачи <span className="badge">Pro</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* 4. Функции Pro+ */}
        <Link href={`/pro-plus/tools${linkSuffix}` as Route} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🚀</span>
            <span className="card__title">Эксперт центр <span className="badge badge--gold">Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>

      {/* Нижняя кнопка-аккордеон */}
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => { setOpen(v => !v); haptic('light'); }}
          className="ghost-link"
          style={{ textDecoration: 'none' as any }}
          aria-expanded={open}
        >
          🌐 Сменить язык/страну
        </button>
      </div>

      {/* Панель аккордеона */}
      {open && (
        <div
          style={{
            marginTop: 12,
            border: '1px dashed #4a4e6a',
            background: '#141823',
            borderRadius: 14,
            padding: 14,
            maxWidth: 560,
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          {/* Языки */}
          <div style={{ marginBottom: 10, opacity: .8, fontSize: 12, letterSpacing: .2 }}>Выберите язык интерфейса</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {LOCALES.map((l) => (
              <button
                key={l.code}
                onClick={() => changeLocale(l.code)}
                disabled={saving?.startsWith('locale:')}
                className="list-btn"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  borderRadius: 12, padding: '10px 12px',
                  background: '#171a21', border: '1px solid var(--border)'
                }}
              >
                <span style={{ width: 22, textAlign: 'center' }}>{l.flag}</span>
                <span style={{ fontWeight: 600 }}>{l.label}</span>
              </button>
            ))}
          </div>

          {/* Страны (необязательный выбор) */}
          <div style={{ marginTop: 14, opacity: .8, fontSize: 12, letterSpacing: .2 }}>Страна (для локальных настроек)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
            {COUNTRIES.map(c => (
              <button
                key={c.code}
                onClick={() => changeCountry(c.code)}
                disabled={saving?.startsWith('country:')}
                style={{
                  borderRadius: 999, padding: '6px 10px',
                  background: '#1a2030', border: '1px solid #2a2f45',
                  fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6
                }}
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
