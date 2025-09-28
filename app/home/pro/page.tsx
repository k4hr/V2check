'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import BackBtn from '@/app/components/BackBtn';

type Row = {
  emoji: string;
  title: string;
  href?: Route;
  soon?: boolean;
};

export default function ProHub() {
  const [q, setQ] = useState('');

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // если открыто без TWA — пробрасываем ?id=
  const id = useMemo(() => {
    try { const u = new URL(window.location.href); return u.searchParams.get('id') || ''; }
    catch { return ''; }
  }, []);

  const to = (pathname: Route) =>
    (id ? { pathname, query: { id } } : pathname);

  const rows: Row[] = [
    { emoji: '📝', title: 'Переписать текст', soon: true },
    { emoji: '📅', title: 'План на день',     soon: true },
    { emoji: '🌍', title: 'Переводчик',       soon: true },
  ];

  const filtered = rows.filter(r =>
    r.title.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <BackBtn fallback="/home" />

      <h1 style={{ textAlign: 'center' }}>Ежедневные задачи — Pro</h1>
      <p style={{ textAlign: 'center', opacity: .7, marginTop: 6 }}>
        Хаб инструментов. Наполним блоками по мере готовности.
      </p>

      {/* Быстрый поиск */}
      <div style={{ marginTop: 12 }}>
        <input
          type="search"
          inputMode="search"
          placeholder="Поиск инструментов…"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: '#141823',
            border: '1px solid var(--border)',
            color: 'var(--fg, #fff)',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
        {filtered.length === 0 && (
          <div className="list-btn" style={{ opacity: .7, justifyContent: 'center' }}>
            Ничего не найдено
          </div>
        )}

        {filtered.map((r, i) => (
          r.href ? (
            <Link key={i} href={to(r.href)} className="list-btn" style={{ textDecoration: 'none', justifyContent: 'space-between' }}>
              <span className="list-btn__left"><span className="list-btn__emoji">{r.emoji}</span><b>{r.title}</b></span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>
          ) : (
            <div key={i} className="list-btn" style={{ opacity: .6, justifyContent: 'space-between' }}>
              <span className="list-btn__left"><span className="list-btn__emoji">{r.emoji}</span><b>{r.title}</b></span>
              <span className="list-btn__right">{r.soon ? 'Скоро' : ''}</span>
            </div>
          )
        ))}
      </div>
    </main>
  );
}
