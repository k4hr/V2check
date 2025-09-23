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

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

function getDebugIdFromUrl(): string | null {
  try {
    const u = new URL(window.location.href);
    const id = u.searchParams.get('id');
    if (id && /^\d{3,15}$/.test(id)) return id;
  } catch {}
  return null;
}

export default function CasesPage() {
  const [items, setItems] = useState<CaseListItem[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [userInitData, setUserInitData] = useState<string>('');

  // загружаем initData из Telegram WebApp (если открыто в TWA)
  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const initData = WebApp?.initData || '';
    if (initData) setUserInitData(initData);
  }, []);

  // если нет initData (браузерный дебаг) — добавим ?id=...
  const apiSuffix = useMemo(() => {
    if (userInitData) return '';
    if (DEBUG) {
      const dbg = getDebugIdFromUrl();
      if (dbg) return `?id=${encodeURIComponent(dbg)}`;
    }
    return '';
  }, [userInitData]);

  // общие заголовки для API
  const apiHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (userInitData) h['x-init-data'] = userInitData;
    return h;
  }, [userInitData]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases${apiSuffix}`, {
        method: 'GET',
        headers: apiHeaders,
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) setItems(Array.isArray(data.items) ? data.items : []);
      else setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [apiSuffix, apiHeaders]); // перезагружаем, когда появился initData/id

  async function createCase() {
    const name = title.trim();
    if (!name) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cases${apiSuffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders },
        body: JSON.stringify({ title: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setTitle('');
        await load();
      }
    } finally {
      setLoading(false);
    }
  }

  const linkSuffix = apiSuffix; // чтобы пробрасывать ?id=... в ссылки на кейсы

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

      {loading && <div style={{ opacity: .7, marginTop: 10 }}>Загружаем…</div>}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {items.map(it => (
          <a
            key={it.id}
            href={`/cabinet/cases/${it.id}${linkSuffix}`}
            className="list-btn"
            style={{ textDecoration: 'none' }}
          >
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
