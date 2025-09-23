'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

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
  const [error, setError]   = useState<string | null>(null);

  // Телеграм initData и небезопасный фолбэк
  const [initData, setInitData] = useState<string>('');
  const [unsafeUserId, setUnsafeUserId] = useState<string>('');

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const _init = WebApp?.initData || '';
    setInitData(_init || '');
    const uid = WebApp?.initDataUnsafe?.user?.id;
    if (uid) setUnsafeUserId(String(uid));
  }, []);

  // Куда подставляем ?id=... если initData пустой
  const apiSuffix = useMemo(() => {
    if (initData) return '';
    if (unsafeUserId) return `?id=${encodeURIComponent(unsafeUserId)}`;
    if (DEBUG) {
      const dbg = getDebugIdFromUrl();
      if (dbg) return `?id=${encodeURIComponent(dbg)}`;
    }
    return '';
  }, [initData, unsafeUserId]);

  // Заголовки для API
  const apiHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = {};
    if (initData) h['x-init-data'] = initData;
    return h;
  }, [initData]);

  // query объект для Link, чтобы typedRoutes не ругался на строки с ?id
  const linkQuery = useMemo(() => {
    if (!apiSuffix) return undefined;
    const qs = new URLSearchParams(apiSuffix.replace(/^\?/, ''));
    const obj: Record<string, string> = {};
    qs.forEach((v, k) => (obj[k] = v));
    return obj;
  }, [apiSuffix]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases${apiSuffix}`, { headers: { ...apiHeaders }, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP_${res.status}`);
      setItems(data.items || []);
    } catch (e: any) {
      setError(e?.message || 'AUTH_REQUIRED');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [apiSuffix, apiHeaders]);

  async function createCase() {
    const name = title.trim();
    if (!name) return;
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
      setError(e?.message || 'AUTH_REQUIRED');
    } finally {
      setLoading(false);
    }
  }

  function fmt(d?: string | null): string {
    if (!d) return '';
    const x = new Date(d);
    return `${String(x.getDate()).padStart(2, '0')}.${String(x.getMonth() + 1).padStart(2, '0')}.${x.getFullYear()}`;
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

      {error && <div style={{ color: 'tomato', marginTop: 10 }}>{error}</div>}
      {loading && <div style={{ opacity: .7, marginTop: 10 }}>Загружаем…</div>}

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {!loading && !items.length && <div style={{ opacity: .7 }}>Пока нет дел.</div>}

        {items.map(it => (
          <Link
            key={it.id}
            href={{ pathname: `/cabinet/cases/${it.id}`, query: linkQuery }}
            className="list-btn"
            style={{ textDecoration: 'none' }}
          >
            <span className="list-btn__left">
              <b>{it.title}</b>
              <div style={{ opacity: .7, fontSize: 12, marginTop: 4 }}>
                {it.status === 'active' ? 'Активно' : it.status === 'closed' ? 'Закрыто' : 'В архиве'}
                {it.nextDueAt ? ` • Ближайший срок: ${fmt(it.nextDueAt)}` : ''}
                {typeof it._count?.items === 'number' ? ` • Записей: ${it._count.items}` : ''}
              </div>
            </span>
            <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
          </Link>
        ))}
      </div>
    </main>
  );
}
