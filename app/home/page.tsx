'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';

type Locale = 'ru' | 'en' | 'uk' | 'kk' | 'tr' | 'az' | 'ka' | 'hy';

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский',      flag: '🇷🇺' },
  { code: 'en', label: 'English',      flag: '🇬🇧' },
  { code: 'uk', label: 'Українська',   flag: '🇺🇦' },
  { code: 'kk', label: 'Қазақша',      flag: '🇰🇿' },
  { code: 'tr', label: 'Türkçe',       flag: '🇹🇷' },
  { code: 'az', label: 'Azərbaycanca', flag: '🇦🇿' },
  { code: 'ka', label: 'ქართული',      flag: '🇬🇪' },
  { code: 'hy', label: 'Հայերեն',      flag: '🇦🇲' },
];

/** страна по умолчанию для каждого языка (для локальных настроек) */
const DEFAULT_COUNTRY: Record<Locale, string> = {
  ru: 'RU',
  en: 'US',
  uk: 'UA',
  kk: 'KZ',
  tr: 'TR',
  az: 'AZ',
  ka: 'GE',
  hy: 'AM',
};

function getCookie(name: string): string {
  try {
    const raw = (document.cookie || '').split('; ').find(p => p.startsWith(name + '='));
    return raw ? decodeURIComponent(raw.split('=').slice(1).join('=')) : '';
  } catch { return ''; }
}
function setCookie(k: string, v: string) {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${k}=${encodeURIComponent(v)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {}
}
function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // начальные cookie (если нет — ru/RU)
  const initialLocale  = useMemo(() => ((getCookie('locale') as Locale) || 'ru'), []);
  const initialCountry = useMemo(() => (getCookie('country') || DEFAULT_COUNTRY[(getCookie('locale') as Locale) || 'ru']), []);
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // страна будет рассчитана на сохранении
  const derivedCountry = DEFAULT_COUNTRY[locale];
  const hasChanges = locale !== initialLocale || derivedCountry !== initialCountry;

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
    } catch { return ''; }
  }, []);

  async function save() {
    if (saving || !hasChanges) return;
    setSaving(true);
    setCookie('locale', locale);
    setCookie('country', derivedCountry);
    haptic('medium');
    setTimeout(() => { window.location.reload(); }, 150);
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

        <Link href={`/pro/tools${linkSuffix}` as Route} className="card card--pro" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🧰</span>
            <span className="card__title">Ежедневные задачи <span className="badge">Pro</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        <Link href={`/pro-plus/tools${linkSuffix}` as Route} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🚀</span>
            <span className="card__title">Эксперт центр <span className="badge badge--gold">Pro+</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>
      </div>

      {/* Кнопка-аккордеон */}
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

      {/* Панель аккордеона: только выбор языка */}
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
          <div style={{ marginBottom: 10, opacity: .8, fontSize: 12, letterSpacing: .2 }}>Выберите язык интерфейса</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 8 }}>
            {LOCALES.map((l) => {
              const active = locale === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code)}
                  className="list-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderRadius: 12, padding: '10px 12px',
                    background: active ? '#1f2637' : '#171a21',
                    border: `1px solid ${active ? '#5b6cae' : 'var(--border)'}`
                  }}
                >
                  <span style={{ width: 22, textAlign: 'center' }}>{l.flag}</span>
                  <span style={{ fontWeight: 600 }}>{l.label}</span>
                </button>
              );
            })}
          </div>

          {/* Кнопки */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => { setOpen(false); setLocale(initialLocale as Locale); }}
              className="list-btn"
              style={{ padding: '8px 12px', borderRadius: 10, background: '#171a21', border: '1px solid var(--border)' }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!hasChanges || saving}
              className="list-btn"
              style={{
                padding: '8px 14px', borderRadius: 10,
                background: hasChanges ? '#2b3560' : '#202436',
                border: `1px solid ${hasChanges ? '#5b6cae' : '#303652'}`,
                opacity: saving ? .7 : 1
              }}
            >
              {saving ? 'Сохраняем…' : 'Сохранить'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
