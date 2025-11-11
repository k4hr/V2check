/* path: app/cabinet/favorites/page.tsx */
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { readLocale, type Locale, STRINGS } from '@/lib/i18n';
import BackBtn from '@/app/components/BackBtn';

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

  const titleText = useMemo(() => _('favorites', 'Избранное'), [locale]);
  const emptyText = useMemo(
    () => (_('favoritesEmpty', 'Здесь будут сохраняться ваши чаты, при активной подписке Pro+')),
    [locale]
  );

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
      const WebApp: any = (window as any)?.Telegram?.WebApp;
      WebApp?.ready?.(); WebApp?.expand?.();
    } catch {}
  }, [locale]);

  const [items, setItems] = useState<Fav[]>([]);
  const [err, setErr] = useState<string | null>(null);

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

      const res = await fetch(`/api/favorites/threads${qs}`, { method: 'GET', headers, cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'LOAD_FAILED');

      const threads = Array.isArray(data.threads) ? data.threads : [];
      const mapped: Fav[] = threads.map((t: any) => {
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return (
    <div className="page">
      <BackBtn fallback={`/cabinet${linkSuffix}` as Route} />

      <h1 className="title">{titleText}</h1>

      {err && <p className="err">{err}</p>}

      {items.length === 0 ? (
        <p className="empty">{emptyText}</p>
      ) : (
        <div className="list">
          {items.map((it) => {
            const raw = (it.url || '').trim();
            const isExternal = /^https?:\/\//i.test(raw);
            const isInternal = raw.startsWith('/');
            const { date, time } = formatDT(it.updatedAt || it.createdAt, locale);

            const CardInner = (
              <>
                <span className="item__left">
                  <span className="item__emoji">⭐</span>
                  <b className="item__title" title={it.title || _('untitled', 'Без названия')}>
                    {it.title || _('untitled', 'Без названия')}
                  </b>
                </span>
                <span className="item__right">
                  <span className="item__dt">
                    <div>{date}</div>
                    <div>{time}</div>
                  </span>
                  <span className="item__chev">›</span>
                </span>
              </>
            );

            if (isExternal) {
              return (
                <a key={it.id} href={raw} target="_blank" rel="noreferrer" className="item glass">
                  {CardInner}
                </a>
              );
            }

            const withSuffix =
              isInternal
                ? ((raw + (raw.includes('?') ? '&' : '?') + linkSuffix.slice(1)) as Route)
                : (`/cabinet${linkSuffix}` as Route);

            // ВАЖНО: legacyBehavior, чтобы класс точно попал на <a>
            return (
              <Link key={it.id} href={withSuffix} legacyBehavior>
                <a className="item glass" aria-label={`Открыть: ${it.title || _('untitled','Без названия')}`}>
                  {CardInner}
                </a>
              </Link>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .page { padding: 20px; max-width: 780px; margin: 0 auto; }
        .title { text-align: center; margin: 6px 0 12px; color: #0d1220; }
        .err { color: #ff4d6d; text-align: center; }
        .empty { text-align: center; opacity: .75; margin: 16px auto; max-width: 680px; color: #0d1220; }

        /* Белое стекло */
        .glass {
          background: rgba(255,255,255,.78);
          color: #0d1220;
          border: 1px solid rgba(0,0,0,.08);
          box-shadow:
            0 10px 28px rgba(17,23,40,.12),
            inset 0 0 0 1px rgba(255,255,255,.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }

        .list { margin: 0 auto; max-width: 680px; display: grid; gap: 10px; }

        .item {
          text-decoration: none !important;
          border-radius: 14px;
          padding: 12px 14px;
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          gap: 12px;
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        }
        .item:hover { transform: translateY(-1px); }
        .item__left { min-width: 0; display: flex; gap: 10px; align-items: center; }
        .item__emoji { width: 24px; height: 24px; display: grid; place-items: center; }
        .item__title {
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; max-width: 100%;
        }
        .item__right { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
        .item__dt { opacity: .75; font-size: 12px; line-height: 1.05; text-align: right; }
        .item__chev { opacity: .45; font-size: 20px; }
      `}</style>
    </div>
  );
}
