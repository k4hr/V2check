// lib/tma/Proplus/static.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import BackBtn from '@/app/components/BackBtn';
import {
  PRO_PLUS_ROWS,
  PRO_PLUS_TITLE,
  PRO_PLUS_SUBTITLE,
  PRO_PLUS_CTA,
  type Row,
} from '@/app/home/pro-plus/constants';

export default function ProPlusHub() {
  const [q, setQ] = useState('');

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  const id = useMemo(() => {
    try { return new URL(window.location.href).searchParams.get('id') || ''; }
    catch { return ''; }
  }, []);

  const to = (pathname: Route) => (id ? { pathname, query: { id } } : pathname);

  const filtered: Row[] = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return PRO_PLUS_ROWS;
    return PRO_PLUS_ROWS.filter(r => (r.title + ' ' + r.desc).toLowerCase().includes(n));
  }, [q]);

  return (
    <main className="wrap">
      <BackBtn fallback="/home" />

      <h1 className="title">{PRO_PLUS_TITLE}</h1>
      <p className="subtitle">{PRO_PLUS_SUBTITLE}</p>

      <div className="searchBox">
        <input
          type="search"
          inputMode="search"
          placeholder="Поиск по инструментам…"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          className="search"
        />
      </div>

      <div className="grid">
        {filtered.length === 0 && <div className="pro-card empty">Ничего не найдено</div>}

        {filtered.map((r, i) => (
          <div className="pro-card" key={`${r.title}-${i}`}>
            <div className="pro-head">
              <span className="pro-ico" aria-hidden>{r.emoji}</span>
              <div className="pro-text">
                <b className="pro-title">{r.title}</b>
                <small className="pro-sub">{r.desc}</small>
              </div>
            </div>

            {/* Центрированная «золотая» кнопка фиксированного размера */}
            <div className="ctaWrap">
              <Link href={to(r.href)} legacyBehavior>
                <a className="cta" aria-label={`Открыть: ${r.title}`}>
                  {PRO_PLUS_CTA}
                </a>
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .wrap { padding: 20px; max-width: 820px; margin: 0 auto; }
        .title { text-align: center; margin: 0; }
        .subtitle { text-align: center; opacity: .7; margin-top: 6px; }

        /* -------- Белая аккуратная строка поиска -------- */
        .searchBox { margin-top: 14px; }
        .search {
          width: 100%;
          height: 48px;
          padding: 12px 16px;
          border-radius: 14px;
          background: #ffffff;
          border: 1px solid rgba(10,12,20,.10); /* чёткая, тонкая */
          color: #0B0C10;
          outline: none;
          font-size: 16px;
          -webkit-appearance: none;
          appearance: none;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.65), 0 8px 18px rgba(18,28,45,.06);
        }
        .search::placeholder { color: rgba(11,12,16,.45); }
        .search:focus {
          border-color: rgba(255,210,120,.55);
          box-shadow:
            0 0 0 3px rgba(255,210,120,.22),
            inset 0 1px 0 rgba(255,255,255,.75);
        }

        /* -------- Сетка карточек -------- */
        .grid {
          display: grid;
          gap: 16px;
          margin-top: 16px;
          grid-auto-rows: 192px; /* единая высота */
        }

        /* -------- Золотые карточки: светлое стекло + чёрный текст -------- */
        .pro-card {
          height: 100%;
          display: grid;
          grid-template-rows: minmax(0,auto) 1fr auto;
          padding: 20px;
          border-radius: 18px;
          color: #0B0C10; /* ЧЁРНЫЙ ТЕКСТ */
          background:
            radial-gradient(120% 140% at 12% 0%, rgba(255,210,120,.16), rgba(255,210,120,.06) 70%),
            linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.86));
          border: 1px solid rgba(218,165,32,.38); /* аккуратная золотая рамка */
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.70),
            0 10px 26px rgba(215,170,60,.10);
        }
        .pro-card:hover {
          border-color: rgba(218,165,32,.55);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.75),
            0 12px 30px rgba(215,170,60,.14);
          transform: translateY(-1px);
          transition: all .12s ease;
        }
        .pro-card.empty {
          display:flex; justify-content:center; align-items:center; min-height:96px; opacity:.7;
        }

        .pro-head { display:flex; gap:14px; align-items:center; }
        .pro-ico {
          width: 60px; height: 60px; flex: 0 0 60px;
          display: grid; place-items: center;
          font-size: 30px; line-height: 1;
          background: rgba(255,210,120,.22);
          border: 1px solid rgba(218,165,32,.42);
          border-radius: 14px;
          box-shadow: inset 0 1px 0 rgba(255,255,255,.65);
        }
        .pro-text { line-height: 1.15; min-width: 0; }

        /* Заголовок — максимум 2 строки */
        .pro-title {
          display:block;
          font-weight: 800;
          font-size: 16px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        @media (max-width: 360px) { .pro-title { font-size: 15px; } }

        /* Описание — до 3 строк */
        .pro-sub {
          display:block;
          color: rgba(11,12,16,.70);
          margin-top: 6px;
          font-size: 13px; line-height: 1.25;
          overflow: hidden; text-overflow: ellipsis;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
        }

        .ctaWrap { display:flex; justify-content:center; align-items:flex-end; }

        /* Золотая CTA — чёткая, без «мыла» */
        .cta,
        :global(a.cta) {
          display:flex; align-items:center; justify-content:center;
          width: clamp(220px, 68%, 320px);
          height: 48px;
          border-radius: 14px;
          font-weight: 700; font-size: 16px;
          color: #ffffff !important;
          text-decoration: none !important;
          background: linear-gradient(135deg, rgba(255,210,120,.85), rgba(255,191,73,.65));
          border: 1px solid rgba(218,165,32,.68);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.55),
            0 12px 28px rgba(215,170,60,.22);
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
          cursor: pointer;
        }
        .cta:hover,
        :global(a.cta:hover) {
          border-color: rgba(218,165,32,.85);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.65),
            0 14px 34px rgba(215,170,60,.26);
        }
        .cta:active,
        :global(a.cta:active) {
          transform: translateY(1px);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.55),
            0 10px 24px rgba(215,170,60,.20);
        }
      `}</style>
    </main>
  );
}
