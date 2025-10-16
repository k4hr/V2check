// app/cabinet/favorites/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type Fav = {
  id: string;
  title: string;
  url?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatDT(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export default function FavoritesPage() {
  const [items, setItems] = useState<Fav[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [proplusLocked, setProplusLocked] = useState(false);

  function apiBase() {
    const tgInit = (window as any)?.Telegram?.WebApp?.initData || '';
    if (tgInit) return { endpoint: '/api/favorites', headers: { 'x-init-data': tgInit } as Record<string, string> };
    if (DEBUG) {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      const qs = id && /^\d{3,15}$/.test(id) ? `?id=${encodeURIComponent(id)}` : '';
      return { endpoint: `/api/favorites${qs}`, headers: {} as Record<string, string> };
    }
    return { endpoint: '/api/favorites', headers: {} as Record<string, string> };
  }

  async function load() {
    try {
      setErr(null);
      const { endpoint, headers } = apiBase();
      const res = await fetch(endpoint, { method: 'GET', headers });
      const data = await res.json();
      if (res.status === 402 && data?.error === 'PROPLUS_REQUIRED') {
        setProplusLocked(true);
        setItems([]);
        return;
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'LOAD_FAILED');
      setProplusLocked(false);
      setItems((data.items || []) as Fav[]);
    } catch (e: any) {
      setErr(e?.message || 'Ошибка загрузки');
    }
  }

  useEffect(() => {
    try {
      const WebApp: any = (window as any)?.Telegram?.WebApp;
      WebApp?.ready?.(); WebApp?.expand?.();
    } catch {}
    load();
  }, []);

  const emptyText = useMemo(
    () => 'Здесь будут сохраняться ваши чаты, при активной подписке Pro+',
    []
  );

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Избранное</h1>

      {proplusLocked ? (
        <div
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 6 }}>✨ Доступно в Pro+</div>
          <div style={{ opacity: .85, fontWeight: 400 }}>
            Оформите подписку, чтобы сохранять чаты в избранное.
          </div>
        </div>
      ) : (
        <>
          {err && <p style={{ color: 'crimson', textAlign: 'center' }}>{err}</p>}

          <div
            style={{
              margin: '0 auto',
              maxWidth: 680,
              padding: 12,
              border: '1px solid #333',
              borderRadius: 12,
            }}
          >
            {items.length === 0 ? (
              <p style={{ textAlign: 'center', opacity: .75 }}>{emptyText}</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {items.map((it) => {
                  const raw = (it.url || '').trim();
                  const isExternal = /^https?:\/\//i.test(raw);
                  const isInternal = raw.startsWith('/');
                  const created = formatDT(it.createdAt);

                  const CardInner = (
                    <>
                      <span className="list-btn__left" style={{ minWidth: 0 }}>
                        <span className="list-btn__emoji">⭐</span>
                        <b
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {it.title || 'Без названия'}
                        </b>
                      </span>
                      <span className="list-btn__right" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ opacity: .75, fontSize: 12 }}>{created}</span>
                        <span className="list-btn__chev">›</span>
                      </span>
                    </>
                  );

                  const commonStyle = {
                    textDecoration: 'none',
                    border: '1px solid #333',
                    borderRadius: 12,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  } as const;

                  if (isExternal) {
                    return (
                      <a
                        key={it.id}
                        href={raw}
                        target="_blank"
                        rel="noreferrer"
                        className="list-btn"
                        style={commonStyle}
                      >
                        {CardInner}
                      </a>
                    );
                  }

                  // внутренние ссылки через <Link>; если нет валидного пути — ведём в кабинет
                  const safeInternal: Route = (isInternal ? raw : '/cabinet') as Route;

                  return (
                    <Link key={it.id} href={safeInternal} className="list-btn" style={commonStyle}>
                      {CardInner}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ height: 16 }} />

      <Link href="/cabinet" className="list-btn" style={{ textDecoration: 'none' }}>
        <span className="list-btn__left">
          <span className="list-btn__emoji">◀</span>
          <b>Назад в кабинет</b>
        </span>
        <span className="list-btn__right">
          <span className="list-btn__chev">›</span>
        </span>
      </Link>
    </div>
  );
}
