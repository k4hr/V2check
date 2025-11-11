'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import { STRINGS, readLocale, setLocaleEverywhere, ensureLocaleCookie, type Locale } from '@/lib/i18n';
import { detectPlatform } from '@/lib/platform';

const LOCALES = [
  { code:'ru' as const, label:'Русский' }, { code:'uk' as const, label:'Українська' },
  { code:'be' as const, label:'Беларуская' }, { code:'kk' as const, label:'Қазақша' },
  { code:'uz' as const, label:'Oʻzbekcha' }, { code:'ky' as const, label:'Кыргызча' },
  { code:'fa' as const, label:'فارسی' }, { code:'hi' as const, label:'हिन्दी' },
  { code:'en' as const, label:'English' },
];

export default function HomePage() {
  useEffect(() => { try { ensureLocaleCookie({ sameSite:'none', secure:true } as any); } catch {} }, []);
  const locale = useMemo<Locale>(() => readLocale(), []);
  const L = STRINGS[locale];
  const platform = useMemo(() => detectPlatform(), []);

  const [openLang, setOpenLang] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<Locale>(locale);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
    try { document.documentElement.lang = locale; } catch {}
    if (openLang) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }, [locale, openLang]);

  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1');
      const id = u.searchParams.get('id'); if (id) sp.set('id', id);
      const s = sp.toString(); return s ? `?${s}` : '';
    } catch { return '?welcomed=1'; }
  }, []);
  const href = (p: string) => `${p}${linkSuffix}` as Route;

  async function onSaveLocale() {
    if (saving) return;
    setSaving(true);
    setLocaleEverywhere(pendingLocale);
    const url = new URL(window.location.href);
    url.searchParams.set('_lng', String(Date.now()));
    window.location.replace(url.toString());
  }

  return (
    <main className="home">
      <h1 className="title">{L.appTitle}</h1>
      <p className="subtitle">{L.subtitle}</p>

      {/* === БЕНТО-СЕТКА === */}
      <section className="bento">
        {/* Герой на две колонки */}
        <Link href={href('/home/ChatGPT')} className="tile tile--hero glass no-underline">
          <span className="tile__content">
            <span className="hero__label">CHATGPT 5</span>
          </span>
          <span className="chev">›</span>
          <span className="hero__glow" aria-hidden />
        </Link>

        {/* Кабинет */}
        <Link href={href('/cabinet')} className="tile glass no-underline">
          <span className="tile__content">
            <span className="tile__title">{L.cabinet}</span>
          </span>
          <span className="chev">›</span>
        </Link>

        {/* Купить подписку */}
        <Link href={href('/pro')} className="tile glass no-underline">
          <span className="tile__content">
            <span className="tile__title">
              {L.buy} <span className="badge">{L.pro} / <span className="badge--gold">{L.proplus}</span></span>
            </span>
          </span>
          <span className="chev">›</span>
        </Link>

        {/* Ежедневные задачи (Pro) */}
        <Link href={href('/home/pro')} className="tile glass no-underline">
          <span className="tile__content">
            <span className="tile__title">{L.daily} <span className="badge">{L.pro}</span></span>
          </span>
          <span className="chev">›</span>
        </Link>

        {/* Эксперт центр (Pro+) — золотой акцент */}
        <Link href={href('/home/pro-plus')} className="tile glass tile--gold no-underline">
          <span className="tile__content">
            <span className="tile__title">
              {L.expert} <span className="badge badge--gold">{L.proplus}</span>
            </span>
          </span>
          <span className="chev">›</span>
        </Link>

        {/* Язык — как плитка */}
        {platform !== 'vk' && (
          <button type="button" onClick={() => setOpenLang(v => !v)} className="tile glass as-button">
            <span className="tile__content">
              <span className="tile__title">{L.changeLang}</span>
            </span>
            <span className="chev">›</span>
          </button>
        )}
      </section>

      {/* Модалка выбора языка */}
      {openLang && platform !== 'vk' && (
        <div className="lang-sheet glass">
          <div className="lang-sheet__title">{L.chooseLang}</div>
          <div className="lang-grid">
            {LOCALES.map(l => {
              const active = pendingLocale === l.code;
              return (
                <button
                  key={l.code}
                  onClick={() => setPendingLocale(l.code)}
                  className={`lang-btn ${active ? 'lang-btn--active' : ''}`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          <div className="lang-actions">
            <button className="btn glass" onClick={() => setOpenLang(false)}>{STRINGS[locale].cancel}</button>
            <button className="btn btn--primary glass" disabled={pendingLocale===locale || saving} onClick={onSaveLocale}>
              {STRINGS[locale].save}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .no-underline { text-decoration: none; }
        .home { padding: 20px; max-width: 860px; margin: 0 auto; }
        .title { text-align: center; margin: 0 0 6px; }
        .subtitle { text-align: center; opacity: .8; margin: 0 0 14px; }

        /* Белое стекло — единый стиль */
        .glass {
          background: rgba(255,255,255,.78);
          color: #0d1220;
          border: 1px solid rgba(0,0,0,.08);
          box-shadow:
            0 12px 32px rgba(17,23,40,.12),
            inset 0 0 0 1px rgba(255,255,255,.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }

        /* Сетка бенто */
        .bento {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .tile {
          position: relative;
          border-radius: 16px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        }
        .tile:hover { transform: translateY(-1px); }
        .tile:active { transform: translateY(0); }
        .as-button { border: none; cursor: pointer; text-align: left; }

        .tile__content { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .tile__title { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .badge {
          margin-left: 8px; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 700;
          background: rgba(45,126,247,.08); border: 1px solid rgba(45,126,247,.35);
        }
        .badge--gold {
          background: rgba(231,186,82,.16);
          border-color: rgba(231,186,82,.45);
        }
        .chev { opacity: .45; font-size: 20px; }

        /* Герой */
        .tile--hero {
          grid-column: 1 / -1;
          min-height: 86px;
          overflow: hidden;
          isolation: isolate;
        }
        .hero__label {
          font-weight: 900;
          letter-spacing: .06em;
          font-size: 18px;
          background: linear-gradient(180deg, #DFC77E, #B28A3A);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          text-shadow: 0 0 24px rgba(221,187,110,.25);
        }
        .hero__glow {
          position: absolute; inset: -30%;
          background: radial-gradient(60% 60% at 30% 20%, rgba(231,186,82,.28), transparent 60%);
          filter: blur(18px); z-index: -1; pointer-events: none;
          animation: glow 3.2s ease-in-out infinite;
        }
        @keyframes glow { 0%,100%{opacity:.55; transform:translate3d(0,0,0)} 50%{opacity:.9; transform:translate3d(4px,-4px,0)} }

        /* Золотая плитка (Pro+) */
        .tile--gold {
          box-shadow:
            0 12px 32px rgba(231,186,82,.12),
            inset 0 0 0 1px rgba(255,255,255,.55);
          border-color: rgba(231,186,82,.45);
        }

        /* Языковая шторка */
        .lang-sheet {
          margin: 16px auto 0;
          padding: 14px;
          border-radius: 16px;
          max-width: 560px;
        }
        .lang-sheet__title { opacity: .85; font-size: 12px; margin-bottom: 10px; letter-spacing: .2px; }
        .lang-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 8px; }
        .lang-btn {
          padding: 10px 12px; border-radius: 12px; border: 1px solid var(--card-border, rgba(0,0,0,.08));
          background: rgba(255,255,255,.68); font-weight: 600;
        }
        .lang-btn--active {
          background: rgba(255,255,255,.88);
          border: 1px solid #6573ff;
          box-shadow: 0 0 0 3px rgba(101,115,255,.15) inset;
        }
        .lang-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px; }
        .btn { padding: 10px 14px; border-radius: 12px; border: 1px solid rgba(0,0,0,.08); }
        .btn--primary { border-color: #4b57b3; background: linear-gradient(180deg, rgba(45,126,247,.12), rgba(45,126,247,.08)); }

        @media (min-width: 720px) {
          .bento { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .tile--hero { grid-column: 1 / -1; min-height: 96px; }
        }
      `}</style>
    </main>
  );
}
