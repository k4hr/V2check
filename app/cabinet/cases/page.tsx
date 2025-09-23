'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

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
  const [error, setError] = useState<string | null>(null);
  const [userInitData, setUserInitData] = useState<string>('');

  // Telegram initData (если открыто в TWA)
  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const initData = WebApp?.initData || '';
    if (initData) setUserInitData(initData);
  }, []);

  const debugId = useMemo(() => (DEBUG ? getDebugIdFromUrl() : null), []);
  const ready = Boolean(userInitData) || Boolean(debugId);

  const apiSuffix = useMemo(() => {
    if (!userInitData && debugId) return `?id=${encodeURIComponent(debugId)}`;
    return '';
  }, [userInitData, debugId]);

  const apiHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (userInitData) h['x-init-data'] = userInitData;
    return h;
  }, [userInitData]);

  const loadSeq = useRef(0);

  async function load() {
    // игнор без готовности (чтобы не получить 401 раньше времени)
    if (!ready) return;
    const seq = ++loadSeq.current;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases${apiSuffix}`, { headers: apiHeaders, cache: 'no-store' });
      const data = await res.json();
      if (loadSeq.current !== seq) return; // пришёл старый ответ — игнор
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);
      setItems(data.items || []);
    } catch (e: any) {
      if (loadSeq.current !== seq) return;
      setError(e?.message || 'Ошибка');
    } finally {
      if (loadSeq.current === seq) setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [ready, apiSuffix, apiHeaders]);

  async function createCase() {
    const name = title.trim();
    if (!name || !ready) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases${apiSuffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders },
        body: JSON.stringify({ title: name }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);
      setTitle('');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Ошибка создания');
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
        <button className="list-btn" onClick={createCase} disabled={loading || !title.trim() || !ready} style={{ padding: '0 16px' }}>
          Создать
        </button>
      </div>

      {!ready && <p style={{ opacity:.7, marginTop:8 }}>Инициализация…</p>}
      {error && <p style={{ color:'tomato', marginTop:8 }}>Ошибка: {error}</p>}
      {!items.length && ready && !loading && <p style={{ opacity:.7, marginTop:8 }}>Пока нет дел.</p>}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {items.map(it => (
          <a
            key={it.id}
            href={`/cabinet/cases/${it.id}${apiSuffix}`}
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
