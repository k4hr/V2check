'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';

/** Поддерживаемые локали — RU / EN */
type Locale = 'ru' | 'en';

/** Мини-словарь текстов главной */
const STRINGS: Record<Locale, {
  appTitle: string;
  subtitle: string;
  cabinet: string;
  buy: string;
  daily: string;
  expert: string;
  changeLang: string;
  chooseLang: string;
  cancel: string;
  save: string;
  pro: string;
  proplus: string;
}> = {
  ru: {
    appTitle: 'LiveManager',
    subtitle: 'Умные инструменты на каждый день',
    cabinet: 'Личный кабинет',
    buy: 'Купить подписку',
    daily: 'Ежедневные задачи',
    expert: 'Эксперт центр',
    changeLang: 'Сменить язык',
    chooseLang: 'Выберите язык интерфейса',
    cancel: 'Отмена',
    save: 'Сохранить',
    pro: 'Pro',
    proplus: 'Pro+',
  },
  en: {
    appTitle: 'LiveManager',
    subtitle: 'Smart tools for every day',
    cabinet: 'Account',
    buy: 'Buy subscription',
    daily: 'Daily tasks',
    expert: 'Expert Center',
    changeLang: 'Change language',
    chooseLang: 'Choose interface language',
    cancel: 'Cancel',
    save: 'Save',
    pro: 'Pro',
    proplus: 'Pro+',
  },
};

/** Языки для выбора */
const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

/* ---------- утилиты ---------- */
function getCookie(name: string): string {
  try {
    const p = (document.cookie || '').split('; ').find(r => r.startsWith(name + '='));
    return p ? decodeURIComponent(p.split('=').slice(1).join('=')) : '';
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
function readLocale(): Locale {
  const v = (getCookie('NEXT_LOCALE') || getCookie('locale') || 'ru').toLowerCase();
  return v === 'en' ? 'en' : 'ru';
}
function setLocaleEverywhere(code: Locale) {
  setCookie('locale', code);
  setCookie('NEXT_LOCALE', code);
  try { document.documentElement.lang = code; } catch {}
}

/* ---------- страница ---------- */
export default function HomePage() {
  const [open, setOpen] = useState(false);

  const currentLocale = useMemo<Locale>(() => readLocale(), []);
  const [pendingLocale, setPendingLocale] = useState<Locale>(currentLocale);
  const [saving, setSaving] = useState(false);

  const L = STRINGS[currentLocale];

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
    try { document.documentElement.lang = currentLocale; } catch {}
    if (open) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [currentLocale, open]);

  // сохраняем ?id= из TWA
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);
  const href = (p: string) => `${p}${linkSuffix}` as Route;

  async function onSave() {
    if (saving) return;
    setSaving(true);
    setLocaleEverywhere(pendingLocale);
    haptic('medium');
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
      <h1 style={{ textAlign: 'center' }}>{L.appTitle}</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>{L.subtitle}</p>

      {/* Карточки */}
      <div className="lm-grid" style={{ marginTop: 16 }}>
        {/* ЛК (остается вне /home) */}
        <Link href={href('/cabinet')} className="card" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">👤</span>
            <span className="card__title">{L.cabinet}</span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* Подписка Pro/Pro+ — теперь под /home */}
        <Link href={href('/home/pro')} className="card card--pro" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">⭐</span>
            <span className="card__title">{L.buy} <span className="badge">{L.pro} / {L.proplus}</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* Ежедневные задачи (Pro-инструменты) */}
        <Link href={href('/home/pro/tools')} className="card card--pro" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🧰</span>
            <span className="card__title">{L.daily} <span className="badge">{L.pro}</span></span>
          </span>
          <span className="card__chev">›</span>
        </Link>

        {/* Эксперт-центр (Pro+) */}
        <Link href={href('/home/pro-plus/tools')} className="card card--proplus" style={{ textDecoration: 'none' }}>
          <span className="card__left">
            <span className="card__icon">🚀</span>
            <span className="card__title">{L.expert} <span className="badge badge--gold">{L.proplus}</span></span>
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
          🌐 {L.changeLang}
        </button>
      </div>

      {/* Аккордеон выбора языка */}
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
            {L.chooseLang}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
            {LOCALES.map((l) => {
              const active = pendingLocale === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setPendingLocale(l.code)}
                  className="list-btn"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    borderRadius: 12, padding: '10px 12px',
                    background: active ? '#1e2434' : '#171a21',
                    border: active ? '1px solid #6573ff' : '1px solid var(--border)',
                    boxShadow: active ? '0 0 0 3px rgba(101,115,255,.15) inset' : 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}
                >
                  <span style={{ width: 22, textAlign: 'center', flex: '0 0 22px' }}>{l.flag}</span>
                  <span style={{ fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              className="list-btn"
              style={{ padding: '10px 14px', borderRadius: 12, background: '#1a1f2b', border: '1px solid var(--border)' }}
            >
              {STRINGS[currentLocale].cancel}
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving || pendingLocale === currentLocale}
              className="list-btn"
              style={{
                padding: '10px 14px', borderRadius: 12,
                background: saving ? '#2a3150' : '#2e3560',
                border: '1px solid #4b57b3', opacity: saving ? .7 : 1
              }}
            >
              {STRINGS[currentLocale].save}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
