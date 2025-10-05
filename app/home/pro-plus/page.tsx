// app/home/pro-plus/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import BackBtn from '@/app/components/BackBtn';

type Tile = { emoji: string; title: string; href: Route };

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

  const tiles: Tile[] = [
    { emoji: '🤖', title: 'Pro+ чат ИИ (юрид.)',       href: '/home/pro-plus/urchatgpt' as Route },
    { emoji: '💼', title: 'Бизнес-чат: запуск/анализ', href: '/home/pro-plus/businesschat' as Route },
  ];

  const filtered = tiles.filter(t => t.title.toLowerCase().includes(q.trim().toLowerCase()));

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

      {/* Плитки */}
      <div className="grid">
        {filtered.length === 0 && (
          <div className="empty">Ничего не найдено</div>
        )}

        {filtered.map((t, i) => (
          <Link key={i} href={to(t.href)} className="tile" draggable={false} aria-label={t.title}>
            <span className="emoji-wrap"><span className="emoji">{t.emoji}</span></span>
            <span className="caption">{t.title}</span>
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
          grid-template-columns: repeat(2, minmax(0, 1fr)); /* ровно 2 в ряд */
          gap: 16px;
          margin-top: 18px;
        }

        /* Сброс ссылок (включая iOS) */
        a.tile, a.tile:link, a.tile:visited, a.tile:hover, a.tile:active, a.tile:focus {
          color: inherit !important;
          text-decoration: none !important;
          -webkit-text-decoration: none !important;
          text-decoration-color: transparent !important;
        }

        /* Плитка */
        .tile {
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;     /* центр по горизонтали */
          justify-content: center; /* и по вертикали */
          gap: 12px;
          min-height: 150px;
          padding: 18px 16px;
          border-radius: 16px;

          /* фоновый слой + заметная рамка всегда */
          background:
            radial-gradient(120% 120% at 100% 0%, rgba(101,115,255,0.10), transparent 60%),
            #141823;
          border: 1.6px solid #3b4666;       /* РАМКА ВСЕГДА ВИДНА */
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.02),
            0 8px 24px rgba(0,0,0,.35);
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease;
        }
        .tile:hover {
          transform: translateY(-1px);
          border-color: #5966d9;
          box-shadow:
            0 0 0 3px rgba(101,115,255,.16),
            0 14px 36px rgba(0,0,0,.55);
        }
        .tile:active { transform: translateY(0); }

        /* Иконка — строго по центру */
        .emoji-wrap {
          width: 74px;
          height: 74px;
          border-radius: 18px;
          display: grid;
          place-items: center;              /* центрирование обе оси */
          margin: 0 auto;                   /* и внутри плитки */
          background:
            radial-gradient(100% 100% at 30% 30%, rgba(101,115,255,.18), rgba(0,0,0,0)),
            #1b2130;
          border: 1.6px solid #2a3355;      /* рамка и на иконке */
          box-shadow: inset 0 0 24px rgba(101,115,255,.08);
        }
        .emoji { font-size: 30px; line-height: 1; }

        /* Подпись — строго по центру, без подчёркиваний */
        .caption {
          text-align: center;
          font-weight: 900;
          letter-spacing: .2px;
          text-decoration: none !important;
          -webkit-text-decoration: none !important;
          text-decoration-color: transparent !important;
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
