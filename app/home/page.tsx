'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';

/** Поддерживаемые локали */
type Locale =
  | 'ru' | 'en' | 'uk' | 'kk' | 'tr' | 'az' | 'ka' | 'hy'
  | 'be' | 'uz' | 'ky' | 'ro'
  | 'ar' | 'he'
  | 'hi' | 'id' | 'ms' | 'fil' | 'vi' | 'th'
  | 'pl' | 'cs' | 'sk' | 'hu' | 'bg' | 'sr';

/** Список языков с нативным названием и флагом */
const LOCALES: { code: Locale; label: string; flag: string }[] = [
  // СНГ и рядом
  { code: 'ru', label: 'Русский',        flag: '🇷🇺' },
  { code: 'be', label: 'Беларуская',     flag: '🇧🇾' },
  { code: 'uk', label: 'Українська',     flag: '🇺🇦' },
  { code: 'kk', label: 'Қазақша',        flag: '🇰🇿' },
  { code: 'uz', label: "O'zbekcha",      flag: '🇺🇿' },
  { code: 'ky', label: 'Кыргызча',       flag: '🇰🇬' },
  { code: 'hy', label: 'Հայերեն',        flag: '🇦🇲' },
  { code: 'az', label: 'Azərbaycanca',   flag: '🇦🇿' },
  { code: 'ka', label: 'ქართული',        flag: '🇬🇪' },
  { code: 'ro', label: 'Română',         flag: '🇲🇩' },
  { code: 'tr', label: 'Türkçe',         flag: '🇹🇷' },

  // MENA
  { code: 'ar', label: 'العربية',         flag: '🇸🇦' },
  { code: 'he', label: 'עברית',           flag: '🇮🇱' },

  // Южная и Юго-Восточная Азия
  { code: 'hi', label: 'हिन्दी',          flag: '🇮🇳' },
  { code: 'id', label: 'Bahasa Indonesia',flag: '🇮🇩' },
  { code: 'ms', label: 'Bahasa Melayu',   flag: '🇲🇾' },
  { code: 'fil',label: 'Filipino',        flag: '🇵🇭' },
  { code: 'vi', label: 'Tiếng Việt',      flag: '🇻🇳' },
  { code: 'th', label: 'ไทย',             flag: '🇹🇭' },

  // Центральная и Восточная Европа
  { code: 'pl', label: 'Polski',          flag: '🇵🇱' },
  { code: 'cs', label: 'Čeština',         flag: '🇨🇿' },
  { code: 'sk', label: 'Slovenčina',      flag: '🇸🇰' },
  { code: 'hu', label: 'Magyar',          flag: '🇭🇺' },
  { code: 'bg', label: 'Български',       flag: '🇧🇬' },
  { code: 'sr', label: 'Српски',          flag: '🇷🇸' },

  // Английский (по миру)
  { code: 'en', label: 'English',         flag: '🇬🇧' },
];

/* ------------------- утилиты ------------------- */
function getCookie(name: string): string {
  try {
    const p = (document.cookie || '').split('; ').find(r => r.startsWith(name + '='));
    return p ? decodeURIComponent(p.split('=').slice(1).join('=')) : '';
  } catch { return ''; }
}
function setCookie(k: string, v: string) {
  try {
    const maxAge = 60 * 60 * 24 * 365; // 1 год
    document.cookie = `${k}=${encodeURIComponent(v)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {}
}
function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}
function readLocale(): Locale {
  const v = (getCookie('NEXT_LOCALE') || getCookie('locale') || 'ru').toLowerCase();
  return (LOCALES.some(l => l.code === v) ? (v as Locale) : 'ru');
}
function setLocaleEverywhere(code: Locale) {
  setCookie('locale', code);
  setCookie('NEXT_LOCALE', code);        // для будущего i18n/next-intl
  try { document.documentElement.lang = code; } catch {}
}

/* ------------------- компонент ------------------- */
export default function Home() {
  const [open, setOpen] = useState(false);

  const currentLocale = useMemo<Locale>(() => readLocale(), []);
  const [pendingLocale, setPendingLocale] = useState<Locale>(currentLocale);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
    // синхронно проставим <html lang="">
    try { document.documentElement.lang = currentLocale; } catch {}
    // небольшая авто-прокрутка, если аккордеон открыт
    if (open) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [currentLocale, open]);

  // ?id= для дебага, если открыто без TWA
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  async function onSave() {
    if (saving) return;
    setSaving(true);
    setLocaleEverywhere(pendingLocale);
    haptic('medium');

    // Жёсткая перезагрузка с cache-busting (для iOS WebView)
    const url = new URL(window.location.href);
    url.searchParams.set('_lng', String(Date.now()));
    window.location.replace(url.toString());
  }

  function onCancel() {
    setPendingLocale(currentLocale);
    setOpen(false);
    haptic('light');
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
          🌐 Сменить язык
        </button>
      </div>

      {/* Аккордеон: выбор языка + кнопки */}
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
          <div style={{ marginBottom: 10, opacity: .8, fontSize: 12, letterSpacing: .2 }}>
            Выберите язык интерфейса
          </div>

          {/* адаптивный грид: красиво в 2-3 колонки, без переполнений */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 8
            }}
          >
            {LOCALES.map((l) => {
              const active = pendingLocale === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setPendingLocale(l.code)}
                  className="list-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    borderRadius: 12,
                    padding: '10px 12px',
                    background: active ? '#1e2434' : '#171a21',
                    border: active ? '1px solid #6573ff' : '1px solid var(--border)',
                    boxShadow: active ? '0 0 0 3px rgba(101,115,255,.15) inset' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ width: 22, textAlign: 'center', flex: '0 0 22px' }}>{l.flag}</span>
                  <span style={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.label}</span>
                </button>
              );
            })}
          </div>

          {/* Кнопки действий */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              className="list-btn"
              style={{ padding: '10px 14px', borderRadius: 12, background: '#1a1f2b', border: '1px solid var(--border)' }}
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || pendingLocale === currentLocale}
              className="list-btn"
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                background: saving ? '#2a3150' : '#2e3560',
                border: '1px solid #4b57b3',
                opacity: saving ? .7 : 1
              }}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
