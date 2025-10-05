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

  // прокидываем ?id= если открыт без TWA
  const id = useMemo(() => {
    try { const u = new URL(window.location.href); return u.searchParams.get('id') || ''; }
    catch { return ''; }
  }, []);

  // typedRoutes-friendly helper
  const to = (pathname: Route) => (id ? { pathname, query: { id } } : pathname);

  const rows: Row[] = [
    { emoji: '🤖', title: 'Pro+ чат ИИ (юрид.)',       href: '/home/pro-plus/urchatgpt' as Route },
    { emoji: '💼', title: 'Бизнес-чат: запуск/анализ', href: '/home/pro-plus/businesschat' as Route },
  ];

  const filtered = rows.filter(r =>
    r.title.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <main style={{ padding: 20, maxWidth: 820, margin: '0 auto' }}>
      <BackBtn fallback="/home" />

      <h1 style={{ textAlign: 'center' }}>Эксперт центр Pro+</h1>
      <p style={{ textAlign: 'center', opacity: .7, marginTop: 6 }}>Выберите инструмент</p>

      {/* Поиск */}
      <div style={{ marginTop: 12 }}>
        <input
          type="search"
          inputMode="search"
          placeholder="Поиск по инструментам…"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          className="tool-search"
        />
      </div>

      {/* Плитки 2 в ряд (на больших — 3) */}
      <div className="grid">
        {filtered.length === 0 && (
          <div className="empty">Ничего не найдено</div>
        )}

        {filtered.map((r, i) => (
          <Link key={i} href={to(r.href)} className="tool-card" aria-label={r.title}>
            <div className="emoji-wrap"><span className="emoji">{r.emoji}</span></div>
            <div className="title">{r.title}</div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .tool-search {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          background: #141823;
          border: 1px solid var(--border);
          color: var(--fg, #fff);
          outline: none;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-top: 14px;
        }
        @media (min-width: 640px) {
          .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        .tool-card {
          position: relative;
          text-decoration: none;
          border-radius: 16px;
          min-height: 120px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background:
            radial-gradient(120% 120% at 100% 0%, rgba(101,115,255,0.12), transparent 60%),
            #141823;
          border: 1px solid var(--border);
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.02),
            0 8px 24px rgba(0,0,0,.35);
          transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease;
        }
        .tool-card:hover {
          transform: translateY(-1px);
          box-shadow:
            0 0 0 3px rgba(101,115,255,.15),
            0 14px 36px rgba(0,0,0,.55);
          border-color: #4b57b3;
        }
        .emoji-wrap {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background:
            radial-gradient(100% 100% at 30% 30%, rgba(101,115,255,.25), rgba(0,0,0,0)),
            #1b2130;
          border: 1px solid #2a3355;
          box-shadow: inset 0 0 24px rgba(101,115,255,.08);
        }
        .emoji { font-size: 28px; line-height: 1; }
        .title {
          text-align: center;
          font-weight: 800;
          letter-spacing: .2px;
          color: var(--fg, #fff);
        }
        .empty {
          grid-column: 1 / -1;
          opacity: .7;
          border: 1px dashed var(--border);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
        }
      `}</style>
    </main>
  );
}
