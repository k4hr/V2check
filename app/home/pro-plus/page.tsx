// app/home/pro-plus/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import BackBtn from '@/app/components/BackBtn';

type Row = { emoji: string; title: string; desc: string; href: Route };

export default function ProPlusHub() {
  const [q, setQ] = useState('');

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  const id = useMemo(() => {
    try { const u = new URL(window.location.href); return u.searchParams.get('id') || ''; }
    catch { return ''; }
  }, []);

  const to = (pathname: Route) => (id ? { pathname, query: { id } } : pathname);

  const rows: Row[] = [
    {
      emoji: '🤖',
      title: 'Pro+ чат ИИ (юрид.)',
      desc: 'Юр-вопросы, черновики документов, анализ кейсов — быстро и аккуратно.',
      href: '/home/pro-plus/urchatgpt' as Route,
    },
    {
      emoji: '💼',
      title: 'Бизнес-чат: запуск/анализ',
      desc: 'Гипотезы, юнит-экономика, воронки, идеи роста и риски для вашего проекта.',
      href: '/home/pro-plus/businesschat' as Route,
    },
  ];

  const filtered = rows.filter(r =>
    r.title.toLowerCase().includes(q.trim().toLowerCase()) ||
    r.desc.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <main className="wrap">
      <BackBtn fallback="/home" />

      <h1 className="title">Эксперт центр Pro+</h1>
      <p className="subtitle">Выберите инструмент</p>

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
          <div className="pro-card" key={i}>
            <div className="pro-head">
              <span className="pro-ico" aria-hidden>{r.emoji}</span>
              <div className="pro-text">
                <b className="pro-title">{r.title}</b>
                <small className="pro-sub">{r.desc}</small>
              </div>
            </div>

            {/* Центрированная CTA-кнопка фиксированного размера */}
            <div className="ctaWrap">
              <Link href={to(r.href)} legacyBehavior>
                <a className="cta" aria-label={`Открыть: ${r.title}`}>Попробовать</a>
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

        /* Золотая карточка как у Crypto Pay */
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
        /* фикс-бокс для эмодзи, строго по центру */
        .pro-ico {
          width: 60px; height: 60px; flex: 0 0 60px;
          display: grid; place-items: center;
          font-size: 30px; line-height: 1;
          background: rgba(255,210,120,.22);
          border: 1px solid rgba(255,210,120,.34);
          border-radius: 14px;
        }
        .pro-text { line-height: 1.15; min-width: 0; }
        .pro-title { display:block; font-weight: 800; font-size: 18px; }  /* уменьшено на 2 */
        .pro-sub { display:block; opacity: .9; margin-top: 6px; font-size: 13px; } /* уменьшено на 1 */

        /* обёртка чтобы кнопка была по центру */
        .ctaWrap { display:flex; justify-content:center; margin-top:16px; }

        /* собственно кнопка – фиксированный размер и золотой стиль */
        .cta {
          display:flex; align-items:center; justify-content:center;
          width: min(420px, 100%); height: 60px;            /* фиксированная ширина/высота */
          border-radius: 14px;
          font-weight: 700; font-size: 16px;
          color: #fff !important; text-decoration: none !important;
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
