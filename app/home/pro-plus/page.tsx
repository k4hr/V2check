// app/home/pro-plus/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import BackBtn from '@/app/components/BackBtn';

type Row = { emoji: string; title: string; href: Route };

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

  // typedRoutes-friendly
  const to = (pathname: Route) =>
    (id ? { pathname, query: { id } } : pathname);

  const rows: Row[] = [
    { emoji: '🤖', title: 'Pro+ чат ИИ (юрид.)',       href: '/home/pro-plus/urchatgpt' as Route },
    { emoji: '💼', title: 'Бизнес-чат: запуск/анализ', href: '/home/pro-plus/businesschat' as Route },
  ];

  const filtered = rows.filter(r =>
    r.title.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <main className="wrap">
      <BackBtn fallback="/home" />

      <h1 className="title">Эксперт центр Pro+</h1>
      <p className="subtitle">Выберите инструмент</p>

      {/* Быстрый поиск */}
      <div style={{ marginTop: 14 }}>
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
        {filtered.length === 0 && (
          <div className="gold-btn empty">Ничего не найдено</div>
        )}

        {filtered.map((r, i) => (
          <Link
            key={i}
            href={to(r.href)}
            className="gold-btn"
            style={{ textDecoration: 'none' }}
          >
            <span className="left">
              <span className="emoji">{r.emoji}</span>
              <b className="label">{r.title}</b>
            </span>
            <span className="chev">›</span>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .wrap { padding: 20px; max-width: 820px; margin: 0 auto; }
        .title { text-align: center; margin: 0; }
        .subtitle { text-align: center; opacity: .7; margin-top: 6px; }

        .search {
          width: 100%;
          padding: 14px 16px;
          border-radius: 14px;
          background: #141823;
          border: 1px solid var(--border);
          color: var(--fg, #fff);
          outline: none;
          font-size: 16px;
        }

        .grid { display: grid; gap: 14px; margin-top: 16px; }

        /* ЗОЛОТАЯ ПОДСВЕТКА + крупные кнопки */
        .gold-btn {
          display: flex; align-items: center; justify-content: space-between;
          min-height: 96px;                 /* ~3x выше прежнего */
          padding: 22px 20px;               /* больше «воздуха» */
          border-radius: 18px;

          background:
            radial-gradient(120% 140% at 12% 0%, rgba(255,210,120,.18), rgba(255,255,255,.03)),
            linear-gradient(135deg, rgba(255,210,120,.10), rgba(255,191,73,.06));
          border: 1px solid rgba(255,210,120,.32);
          box-shadow:
            0 12px 36px rgba(255,191,73,.25),
            inset 0 0 0 1px rgba(255,255,255,.045);

          color: #fff;
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease, background .12s ease;
        }
        .gold-btn:hover {
          transform: translateY(-1px);
          border-color: rgba(255,210,120,.48);
          box-shadow:
            0 18px 48px rgba(255,191,73,.32),
            inset 0 0 0 1px rgba(255,255,255,.06);
          background:
            radial-gradient(120% 140% at 12% 0%, rgba(255,210,120,.22), rgba(255,255,255,.04)),
            linear-gradient(135deg, rgba(255,210,120,.14), rgba(255,191,73,.08));
        }

        .left { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .emoji {
          width: 48px; height: 48px;         /* крупная пиктограмма */
          display: grid; place-items: center;
          font-size: 28px; line-height: 1;
          border-radius: 12px;
          background: rgba(255,210,120,.20);
          border: 1px solid rgba(255,210,120,.34);
        }
        .label {
          display: block;
          font-size: 20px;                   /* крупнее текста */
          line-height: 1.2;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chev { font-size: 28px; opacity: .75; }

        .empty { justify-content: center; opacity: .75; }
      `}</style>
    </main>
  );
}
