// app/solutions/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { ALL_TEMPLATES, CATEGORIES, TemplateMeta } from './templates';

export default function SolutionsPage() {
  const [q, setQ] = useState('');

  const norm = (s: string) => s.toLowerCase().normalize('NFKD');

  const filtered = useMemo(() => {
    const text = norm(q);
    if (!text) return ALL_TEMPLATES;
    return ALL_TEMPLATES.filter(t =>
      norm(t.title).includes(text) ||
      (t.tags || []).some(tag => norm(tag).includes(text)) ||
      norm(t.category).includes(text)
    );
  }, [q]);

  const resultsByCat = useMemo(() => {
    const map = new Map<string, TemplateMeta[]>();
    for (const cat of CATEGORIES.map(c => c.title)) map.set(cat, []);
    for (const t of filtered) {
      map.set(t.category, [...(map.get(t.category) || []), t]);
    }
    return map;
  }, [filtered]);

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', lineHeight: 1.1, margin: '6px 0 10px' }}>
        ТОП-100<br/>готовых решений<br/>ваших проблем
      </h1>

      <div style={{ marginTop: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Быстрый поиск: «возврат товара», «развод», «ИП»…"
          style={{
            width:'100%', padding:'12px 14px', borderRadius:12,
            border:'1px solid var(--border,#333)', background:'transparent',
            color:'inherit', outline:'none', fontSize:14
          }}
        />
        {q && (
          <div style={{ opacity:.7, fontSize:12, marginTop:6 }}>
            Найдено: {filtered.length}
          </div>
        )}
      </div>

      <div style={{ display:'grid', gap:22, marginTop:18 }}>
        {CATEGORIES.map((cat) => {
          const items = resultsByCat.get(cat.title) || [];
          if (items.length === 0) return null;
          return (
            <section key={cat.key}>
              <h3 style={{ margin:'6px 0 10px' }}>{cat.title}</h3>
              <div style={{ display:'grid', gap:10 }}>
                {items.map((t) => (
                  <a
                    key={t.slug}
                    href={`/solutions/${t.slug}`}
                    className="list-btn"
                    style={{ textDecoration:'none' }}
                  >
                    <span className="list-btn__left">
                      <b>{t.title}</b>
                      {t.short ? <div style={{ opacity:.7, fontSize:12, marginTop:4 }}>{t.short}</div> : null}
                    </span>
                    <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
                  </a>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div style={{ height: 16 }} />
    </main>
  );
}
