// app/solutions/page.tsx
'use client';

export const dynamic = 'force-static';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SOLUTIONS } from './solutions.data';

export default function SolutionsHome() {
  // TWA
  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    try {
      tg?.ready?.();
      tg?.expand?.();
      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(() => {
        if (document.referrer) history.back();
        else window.location.href = '/';
      });
    } catch {}
  }, []);

  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return SOLUTIONS;
    return SOLUTIONS.filter((x) => {
      const hay =
        `${x.title} ${x.category} ${(x.keywords || []).join(' ')}`.toLowerCase();
      return hay.includes(s);
    });
  }, [q]);

  // сгруппируем по категории
  const byCat = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const it of filtered) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 6 }}>
        ТОП-100 готовых решений ваших проблем
      </h1>

      <div style={{ marginTop: 10, marginBottom: 16 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Быстрый поиск по горячим словам…"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--border, #333)',
            background: 'transparent',
            color: 'inherit',
            outline: 'none',
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: 18 }}>
        {byCat.map(([cat, items]) => (
          <section key={cat}>
            <h3 style={{ margin: '8px 0 10px', opacity: 0.9 }}>{cat}</h3>
            <div style={{ display: 'grid', gap: 10 }}>
              {items.map((it) => (
                <Link
                  key={it.slug}
                  href={`/solutions/${it.slug}`}
                  className="list-btn"
                  style={{ textDecoration: 'none' }}
                >
                  <span className="list-btn__left">
                    <b>{it.title}</b>
                  </span>
                  <span className="list-btn__right">
                    <span className="list-btn__chev">›</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!filtered.length && (
        <p style={{ opacity: 0.7, marginTop: 12 }}>
          Ничего не нашли. Попробуйте другие ключевые слова.
        </p>
      )}
    </main>
  );
}
