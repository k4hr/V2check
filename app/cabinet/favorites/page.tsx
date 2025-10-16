/* path: app/cabinet/favorites/page.tsx */
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type Fav = {
  id: string;
  title: string;
  url?: string | null;
  note?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

function formatDT(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export default function FavoritesPage() {
  const [items, setItems] = useState<Fav[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const emptyText = useMemo(
    () => 'Здесь будут сохраняться ваши чаты, при активной подписке Pro+',
    []
  );

  async function load() {
    try {
      setErr(null);

      // заголовок с initData или debug-id
      const headers: Record<string, string> = {};
      const tgInit = (window as any)?.Telegram?.WebApp?.initData || '';
      if (tgInit) headers['x-init-data'] = tgInit;

      let qs = '';
      if (!tgInit && DEBUG) {
        const u = new URL(window.location.href);
        const id = u.searchParams.get('id');
        if (id && /^\d{3,15}$/.test(id)) qs = `?id=${encodeURIComponent(id)}`;
      }

      // берём избранные треды
      const res = await fetch(`/api/favorites/threads${qs}`, { method: 'GET', headers, cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'LOAD_FAILED');

      const threads = Array.isArray(data.threads) ? data.threads : [];
      const mapped: Fav[] = threads.map((t: any) => {
        const idSuffix = qs ? `&${qs.slice(1)}` : '';
        const when = String(t.updatedAt || t.lastUsedAt || new Date().toISOString());
        return {
          id: String(t.id),
          title: String(t.title || 'Без названия'),
          url: `/home/ChatGPT?thread=${encodeURIComponent(t.id)}${idSuffix}`,
          note: null,
          createdAt: when,
          updatedAt: when,
        };
      });

      setItems(mapped);
    } catch (e: any) {
      setErr(e?.message || 'Ошибка загрузки');
      setItems([]);
    }
  }

  useEffect(() => {
    try {
      const WebApp: any = (window as any)?.Telegram?.WebApp;
      WebApp?.ready?.(); WebApp?.expand?.();
    } catch {}
    load();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Избранное</h1>

      {err && <p style={{ color: 'crimson', textAlign: 'center' }}>{err}</p>}

      {items.length === 0 ? (
        // ПУСТОЕ СОСТОЯНИЕ БЕЗ РАМКИ (просто текст)
        <p style={{ textAlign: 'center', opacity: .75, margin: '16px auto', maxWidth: 680 }}>
          {emptyText}
        </p>
      ) : (
        // Список избранных с правым столбцом даты/времени
        <div style={{ margin: '0 auto', maxWidth: 680, display: 'grid', gap: 8 }}>
          {items.map((it) => {
            const raw = (it.url || '').trim();
            const isExternal = /^https?:\/\//i.test(raw);
            const isInternal = raw.startsWith('/');
            const { date, time } = formatDT(it.updatedAt || it.createdAt);

            const CardInner = (
              <>
                <span className="list-btn__left" style={{ minWidth: 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="list-btn__emoji">⭐</span>
                  <b
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      maxWidth: '100%',
                    }}
                    title={it.title || 'Без названия'}
                  >
                    {it.title || 'Без названия'}
                  </b>
                </span>

                <span
                  className="list-btn__right"
                  style={{ display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
                >
                  <span style={{ opacity: .75, fontSize: 12, lineHeight: 1.05, textAlign: 'right' }}>
                    <div>{date}</div>
                    <div>{time}</div>
                  </span>
                  <span className="list-btn__chev">›</span>
                </span>
              </>
            );

            const commonStyle = {
              textDecoration: 'none',
              border: '1px solid #333',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              alignItems: 'center',
              gap: 12,
              overflow: 'hidden',
              background: '#121621',
            } as const;

            if (isExternal) {
              return (
                <a key={it.id} href={raw} target="_blank" rel="noreferrer" className="list-btn" style={commonStyle}>
                  {CardInner}
                </a>
              );
            }

            const safeInternal: Route = (isInternal ? raw : '/cabinet') as Route;
            return (
              <Link key={it.id} href={safeInternal} className="list-btn" style={commonStyle}>
                {CardInner}
              </Link>
            );
          })}
        </div>
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
