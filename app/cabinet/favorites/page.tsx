// app/cabinet/favorites/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type Fav = {
  id: string;
  title: string;
  url?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function FavoritesPage() {
  const [items, setItems] = useState<Fav[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [proplusLocked, setProplusLocked] = useState(false);

  function apiBase() {
    const tgInit = (window as any)?.Telegram?.WebApp?.initData || '';
    const hasInit = !!tgInit;
    if (hasInit) return { endpoint: '/api/favorites', headers: { 'x-init-data': tgInit } as Record<string,string> };
    if (DEBUG) {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      const qs = id && /^\d{3,15}$/.test(id) ? `?id=${encodeURIComponent(id)}` : '';
      return { endpoint: `/api/favorites${qs}`, headers: {} as Record<string,string> };
    }
    return { endpoint: '/api/favorites', headers: {} as Record<string,string> };
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
    } catch (e:any) {
      setErr(e?.message || 'Ошибка загрузки');
    }
  }

  async function add() {
    if (busy || proplusLocked) return;
    setBusy(true); setErr(null); setInfo(null);
    try {
      const t = title.trim();
      const u = url.trim();
      const n = note.trim();
      if (!t) throw new Error('Введите название');
      const { endpoint, headers } = apiBase();
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ title: t, url: u || undefined, note: n || undefined }),
      });
      const data = await res.json();
      if (res.status === 402 && data?.error === 'PROPLUS_REQUIRED') {
        setProplusLocked(true);
        setInfo(null);
        return;
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'ADD_FAILED');
      setTitle(''); setUrl(''); setNote('');
      setInfo('Сохранено');
      await load();
    } catch (e:any) {
      setErr(e?.message || 'Ошибка сохранения');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (busy || proplusLocked) return;
    setBusy(true); setErr(null); setInfo(null);
    try {
      const { endpoint, headers } = apiBase();
      const sep = endpoint.includes('?') ? '&' : '?';
      const res = await fetch(`${endpoint}${sep}id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.status === 402 && data?.error === 'PROPLUS_REQUIRED') {
        setProplusLocked(true);
        return;
      }
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'DELETE_FAILED');
      setInfo('Удалено');
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e:any) {
      setErr(e?.message || 'Ошибка удаления');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    try {
      const WebApp: any = (window as any)?.Telegram?.WebApp;
      WebApp?.ready?.(); WebApp?.expand?.();
      load();
    } catch {}
  }, []);

  const disabled = useMemo(() => {
    if (busy || proplusLocked) return true;
    if (!title.trim()) return true;
    return false;
  }, [busy, title, proplusLocked]);

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Избранное</h1>

      {proplusLocked ? (
        <div
          role="alert"
          style={{
            margin:'16px auto',
            maxWidth:680,
            border:'1px solid rgba(255,210,120,.35)',
            background:'rgba(255,210,120,.12)',
            color:'#fff',
            borderRadius:12,
            padding:'14px 16px',
            boxShadow:'0 10px 26px rgba(255,191,73,.18), inset 0 0 0 1px rgba(255,255,255,.04)',
            textAlign:'center',
            fontWeight:600,
          }}
        >
          <div style={{ fontSize:16, marginBottom:6 }}>✨ Доступно в Pro+</div>
          <div style={{ opacity:.85, fontWeight:400 }}>
            Оформите подписку, чтобы сохранять чаты в избранное.
          </div>
          <div style={{ height:10 }} />
          <Link
            href="/cabinet"
            className="list-btn"
            style={{ textDecoration:'none', display:'inline-block', border:'1px solid #333', borderRadius:12, padding:'10px 14px' }}
          >
            Перейти в кабинет
          </Link>
        </div>
      ) : (
        <>
          {err && <p style={{ color: 'crimson', textAlign: 'center' }}>{err}</p>}
          {info && <p style={{ opacity: .7, textAlign: 'center' }}>{info}</p>}

          <div style={{
            margin: '0 auto', maxWidth: 680, padding: 12,
            border: '1px solid #333', borderRadius: 12
          }}>
            <div style={{ display:'grid', gap:8 }}>
              <input
                value={title} onChange={(e)=>setTitle(e.target.value)}
                placeholder="Название" maxLength={120}
                style={{ border:'1px solid #333', borderRadius:10, padding:'10px 12px' }}
              />
              <input
                value={url} onChange={(e)=>setUrl(e.target.value)}
                placeholder="Ссылка (необязательно)" inputMode="url"
                style={{ border:'1px solid #333', borderRadius:10, padding:'10px 12px' }}
              />
              <input
                value={note} onChange={(e)=>setNote(e.target.value)}
                placeholder="Заметка (до 500 символов)" maxLength={500}
                style={{ border:'1px solid #333', borderRadius:10, padding:'10px 12px' }}
              />

              <button
                disabled={disabled}
                onClick={add}
                className="list-btn"
                style={{
                  border:'1px solid #333', borderRadius:12, padding:'12px 16px',
                  opacity: disabled ? .6 : 1
                }}
              >
                ➕ Добавить в избранное
              </button>
            </div>

            <div style={{ height:12 }} />

            {items.length === 0 ? (
              <p style={{ textAlign:'center', opacity:.75 }}>
                Здесь будут сохраняться ваши чаты, при активной подписке Pro+
              </p>
            ) : (
              <div style={{ display:'grid', gap:8 }}>
                {items.map((it) => (
                  <div key={it.id} style={{
                    border:'1px solid #333', borderRadius:10, padding:'10px 12px',
                    display:'flex', alignItems:'center', justifyContent:'space-between', gap:12
                  }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {it.title}
                      </div>
                      {it.url && (
                        <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          <a href={it.url} target="_blank" rel="noreferrer" style={{ textDecoration:'underline' }}>
                            {it.url}
                          </a>
                        </div>
                      )}
                      {it.note && (
                        <div style={{ opacity:.75, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {it.note}
                        </div>
                      )}
                    </div>
                    <button
                      className="list-btn"
                      onClick={()=>remove(it.id)}
                      style={{ border:'1px solid #333', borderRadius:12, padding:'8px 12px' }}
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div style={{ height:16 }} />

      <Link href="/cabinet" className="list-btn" style={{ textDecoration:'none' }}>
        <span className="list-btn__left">
          <span className="list-btn__emoji">◀</span>
          <b>Назад в кабинет</b>
        </span>
        <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
      </Link>
    </div>
  );
}
