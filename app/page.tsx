'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useI18n } from '@/components/I18nProvider';

// Список языков: код локали, нативное название, подпись на англ., флаг
type Lang = { code: string; native: string; en: string; flag: string };
const LANGS: Lang[] = [
  { code: 'ru', native: 'Русский',        en: 'Russian',     flag: '🇷🇺' },
  { code: 'uk', native: 'Українська',     en: 'Ukrainian',   flag: '🇺🇦' },
  { code: 'kk', native: 'Қазақша',        en: 'Kazakh',      flag: '🇰🇿' },
  { code: 'tr', native: 'Türkçe',         en: 'Turkish',     flag: '🇹🇷' },
  { code: 'az', native: 'Azərbaycanca',   en: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'ka', native: 'ქართული',        en: 'Georgian',    flag: '🇬🇪' },
  { code: 'hy', native: 'Հայերեն',        en: 'Armenian',    flag: '🇦🇲' },
  { code: 'en', native: 'English',        en: 'English',     flag: '🇺🇸' },
];

// Нормализация кодов из TG/браузера -> наши ключи
function normalizeLocale(s?: string | null): string | null {
  if (!s) return null;
  const code = s.toLowerCase();
  if (code.startsWith('ru')) return 'ru';
  if (code.startsWith('uk') || code.startsWith('ua')) return 'uk';
  if (code.startsWith('kk')) return 'kk';
  if (code.startsWith('tr')) return 'tr';
  if (code.startsWith('az')) return 'az';
  if (code.startsWith('ka')) return 'ka';
  if (code.startsWith('hy')) return 'hy';
  if (code.startsWith('en')) return 'en';
  return null;
}

export default function LanguagePage() {
  const { t } = useI18n();
  const router = useRouter();
  const qp = useSearchParams();
  const [selected, setSelected] = useState<string | null>(null);

  // Telegram init + авто-выбор по языку Telegram/браузера/куки
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
    // 1) из TG
    const tgLocale = normalizeLocale(w?.Telegram?.WebApp?.initDataUnsafe?.user?.language_code);
    // 2) из куки (если уже был выбор)
    const cookieLocale = normalizeLocale(document.cookie.match(/(?:^|;\s*)locale=([^;]+)/)?.[1]);
    // 3) из браузера
    const browserLocale = normalizeLocale(navigator.language || (navigator as any).userLanguage);
    setSelected(cookieLocale || tgLocale || browserLocale || 'ru');
  }, []);

  // поддержка debug id ?id=...
  const debugId = useMemo(() => {
    const id = qp?.get('id');
    return id && /^\d{3,15}$/.test(id) ? id : null;
  }, [qp]);

  const goNext = () => {
    if (!selected) return;
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `locale=${selected}; path=/; max-age=${oneYear}`;
    try { localStorage.setItem('locale', selected); } catch {}
    const suffix = debugId ? `?id=${encodeURIComponent(debugId)}` : '';
    // После выбора языка сразу ведём на выбор страны
    (router as any).push('/country' + suffix);
  };

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', margin: '6px 0 6px', fontSize: 22, fontWeight: 700 }}>
        Juristum
      </h1>
      <p style={{ textAlign:'center', margin:'0 0 12px', opacity:.7, fontSize:14 }}>
        {t('language.title')}
      </p>

      {/* ОБЩИЙ АККОРДЕОН: всё содержимое спрятано под одним summary */}
      <details className="acc" open>
        <summary className="acc__summary">
          <b>{t('language.title')}</b>
          <span className="chev">›</span>
        </summary>

        <div className="acc__content">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setSelected(l.code)}
              className="list-btn"
              style={{
                textAlign: 'left',
                border: selected === l.code
                  ? '1px solid #5b8cff'
                  : '1px solid var(--border, #333)',
              }}
            >
              <span className="list-btn__left">
                <span className="list-btn__emoji">{l.flag}</span>
                <b>{l.native}</b>
                <span style={{ opacity:.6, marginLeft:8, fontWeight:400 }}>{l.en}</span>
              </span>
              <span className="list-btn__right">{selected === l.code ? '✓' : '›'}</span>
            </button>
          ))}
        </div>
      </details>

      <div style={{ height: 12 }} />
      <button
        onClick={goNext}
        disabled={!selected}
        className="list-btn"
        style={{ opacity: selected ? 1 : .5 }}
      >
        {t('continue')}
      </button>

      {/* Локальные стили аккордеона */}
      <style jsx>{`
        .acc {
          border: 1px solid var(--border, #333);
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255,255,255,0.02);
        }
        .acc__summary {
          list-style: none;
          cursor: pointer;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-weight: 700;
          user-select: none;
        }
        summary::-webkit-details-marker { display: none; }
        .chev { transition: transform .18s ease; display: inline-block; }
        .acc[open] > .acc__summary .chev { transform: rotate(90deg); }
        .acc__content { padding: 10px; display: grid; gap: 10px; border-top: 1px solid var(--border, #333); }
      `}</style>
    </main>
  );
}
