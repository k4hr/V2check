/* path: app/cabinet/favorites/page.tsx */
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { readLocale, type Locale, STRINGS } from '@/lib/i18n';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type Fav = {
  id: string;
  title: string;
  url?: string | null;
  note?: string | null;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

function setWelcomedCookie() {
  try {
    document.cookie = `welcomed=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=None; Secure`;
  } catch {}
}

function localeToBCP47(l: Locale): string {
  switch (l) {
    case 'ru': return 'ru-RU';
    case 'en': return 'en-US';
    case 'uk': return 'uk-UA';
    case 'be': return 'be-BY';
    case 'kk': return 'kk-KZ';
    case 'uz': return 'uz-UZ';
    case 'ky': return 'ky-KG';
    case 'fa': return 'fa-IR';
    case 'hi': return 'hi-IN';
    default:   return 'ru-RU';
  }
}

function formatDT(iso: string, l: Locale) {
  const d = new Date(iso);
  const tag = localeToBCP47(l);
  const date = d.toLocaleDateString(tag, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

export default function FavoritesPage() {
  useEffect(setWelcomedCookie, []);

  const locale: Locale = readLocale();
  const L = STRINGS[locale] ?? STRINGS.ru;
  const _ = (key: keyof typeof L, fallback?: string) =>
    (L as any)[key] ?? (STRINGS.ru as any)[key] ?? fallback ?? String(key);

  // suffix для всех внутренних ссылок (welcomed=1 + переносим id)
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1');
      const id = u.searchParams.get('id');
      if (id) sp.set('id', id);
      const s = sp.toString();
      return s ? `?${s}` : '?welcomed=1';
    } catch { return '?welcomed=1'; }
  }, []);

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
    } catch {}
  }, [locale]);

  const [items, setItems] = useState<Fav[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const titleText = useMemo(() => _('favorites', 'Избранное'), [locale]);
  const emptyText = useMemo(
    () => (_('favoritesEmpty', 'Здесь будут сохраняться ваши чаты, при активной подписке Pro+')),
    [locale]
  );
  const backToCabinet = useMemo(() => (_('backToCabinet', 'Назад в кабинет')), [locale]);

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
        // после ?thread=… добавляем &welcomed=1 (+ debug id если есть)
        const idSuffix = `&welcomed=1${qs ? `&${qs.slice(1)}` : ''}`;
        const when = String(t.updatedAt || t.lastUsedAt || new Date().toISOString());
        return {
          id: String(t.id),
          title: String(t.title || _('untitled', 'Без названия')),
          url: `/home/ChatGPT?thread=${encodeURIComponent(t.id)}${idSuffix}`,
          note: null,
          createdAt: when,
          updatedAt: when,
        };
      });

      setItems(mapped);
    } catch (e: any) {
      setErr(e?.message || _('loadError', 'Ошибка загрузки'));
      setItems([]);
    }
  }

  useEffect(() => {
    try {
      const WebApp: any = (window as any)?.Telegram?.WebApp;
      WebApp?.ready?.(); WebApp?.expand?.();
    } catch {}
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>{titleText}</h1>

      {err && <p style={{ color: 'crimson', textAlign: 'center' }}>{err}</p>}

      {items.length === 0 ? (
        <p style={{ textAlign: 'center', opacity: .75, margin: '16px auto', maxWidth: 680 }}>
          {emptyText}
        </p>
      ) : (
        <div style={{ margin: '0 auto', maxWidth: 680, display: 'grid', gap: 8 }}>
          {items.map((it) => {
            const raw = (it.url || '').trim();
            const isExternal = /^https?:\/\//i.test(raw);
            const isInternal = raw.startsWith('/');
            const { date, time } = formatDT(it.updatedAt || it.createdAt, locale);

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
                    title={it.title || _('untitled', 'Без названия')}
                  >
                    {it.title || _('untitled', 'Без названия')}
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

            const safeInternal: Route = (isInternal ? (raw + (raw.includes('?') ? '&' : '?') + linkSuffix.slice(1)) : `/cabinet${linkSuffix}`) as Route;
            return (
              <Link key={it.id} href={safeInternal} className="list-btn" style={commonStyle}>
                {CardInner}
              </Link>
            );
          })}
        </div>
      )}

      <div style={{ height: 16 }} />

      <Link href={`/cabinet${linkSuffix}` as Route} className="list-btn" style={{ textDecoration: 'none' }}>
        <span className="list-btn__left">
          <span className="list-btn__emoji">◀</span>
          <b>{backToCabinet}</b>
        </span>
        <span className="list-btn__right">
          <span className="list-btn__chev">›</span>
        </span>
      </Link>
    </div>
  );
}
