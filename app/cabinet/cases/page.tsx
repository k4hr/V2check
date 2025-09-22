'use client';

import { useEffect, useMemo, useState } from 'react';

type CaseListItem = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  nextDueAt?: string | null;
  _count?: { items: number };
};

export default function CasesPage() {
  const [items, setItems] = useState<CaseListItem[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  async function load() {
    setLoading(true);
    try {
      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;
      const res = await fetch(`/api/cases${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        headers: { ...(initData ? { 'x-init-data': initData } : {}) },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data?.ok) setItems(data.items || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createCase() {
    const name = title.trim();
    if (!name) return;
    setLoading(true);
    try {
      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;
      const res = await fetch(`/api/cases${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
        body: JSON.stringify({ title: name }),
      });
      const data = await res.json();
      if (data?.ok) {
        setTitle('');
        await load();
      }
    } finally { setLoading(false); }
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>Мои дела</h1>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' ? createCase() : null}
          placeholder="Название дела (например, «Спор с ТСЖ по начислениям»)…"
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
            background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14
          }}
        />
        <button className="list-btn" onClick={createCase} disabled={loading || !title.trim()} style={{ padding: '0 16px' }}>
          Создать
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {items.map(it => (
          <a key={it.id} href={`/cabinet/cases/${it.id}${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`} className="list-btn" style={{ textDecoration: 'none' }}>
            <span className="list-btn__left">
              <b>{it.title}</b>
              <div style={{ opacity: .7, fontSize: 12, marginTop: 4 }}>
                {it.status === 'active' ? 'Активно' : it.status === 'closed' ? 'Закрыто' : 'В архиве'}
                {it.nextDueAt ? ` • Ближайший срок: ${new Date(it.nextDueAt).toLocaleDateString()}` : ''}
                {typeof it._count?.items === 'number' ? ` • Записей: ${it._count.items}` : ''}
              </div>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </a>
        ))}
      </div>
    </main>
  );
}
