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

            <div className="ctaWrap">
              <Link href={to(r.href)} className="cta" aria-label={`Открыть: ${r.title}`}>
                {PRO_PLUS_CTA}
              </Link>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .wrap { padding: 20px; max-width: 820px; margin: 0 auto; }
        .title { text-align: center; margin: 0; }
        .subtitle { text-align: center; opacity: .7; margin-top: 6px; }

        .searchBox { margin-top: 14px; }
        .search {
          width: 100%; padding: 14px 16px; border-radius: 14px;
          background: #141823; border: 1px solid var(--border);
          color: var(--fg, #fff); outline: none; font-size: 16px;
        }

        .grid { display: grid; gap: 16px; margin-top: 16px; }

        .pro-card {
          padding: 20px; border-radius: 18px; color: #fff;
          background:
            radial-gradient(120% 140% at 12% 0%, rgba(255,210,120,.18), rgba(255,255,255,.03)),
            linear-gradient(135deg, rgba(255,210,120,.10), rgba(255,191,73,.06));
          border: 1px solid rgba(255,210,120,.32);
          box-shadow: 0 12px 36px rgba(255,191,73,.25), inset 0 0 0 1px rgba(255,255,255,.045);
        }
        .pro-card.empty { display:flex; justify-content:center; align-items:center; min-height:96px; opacity:.7; }

        .pro-head { display:flex; gap:14px; align-items:center; }
        .pro-ico {
          width: 60px; height: 60px; flex: 0 0 60px;
          display: grid; place-items: center;
          font-size: 30px; line-height: 1;
          background: rgba(255,210,120,.22);
          border: 1px solid rgba(255,210,120,.34);
          border-radius: 14px;
        }
        .pro-text { line-height: 1.15; min-width: 0; }
        .pro-title { display:block; font-weight: 800; font-size: 18px; }
        .pro-sub { display:block; opacity: .9; margin-top: 6px; font-size: 13px; }

        .ctaWrap { display:flex; justify-content:center; margin-top:16px; }
        .cta {
          display:flex; align-items:center; justify-content:center;
          width: min(420px, 100%); height: 60px;
          border-radius: 14px;
          font-weight: 700; font-size: 16px;
          color: #fff; text-decoration: none;
          background: linear-gradient(135deg, rgba(255,210,120,.45), rgba(255,191,73,.25));
          border: 1px solid rgba(255,191,73,.55);
          box-shadow: 0 12px 36px rgba(255,191,73,.28);
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
        }
        .cta:active { transform: translateY(1px); box-shadow: 0 8px 24px rgba(255,191,73,.24); }
      `}</style>
    </main>
  );
}
