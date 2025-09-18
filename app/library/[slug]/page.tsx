'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import {
  CATEGORIES_MAP, getDocsByCategory, type DocItem,
  FREE_LIMIT, wasOpenedToday, markOpenedToday
} from '@/lib/catalog';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

function getDebugId(): string | null {
  try {
    const u = new URL(window.location.href);
    const id = u.searchParams.get('id');
    return id && /^\d{3,15}$/.test(id) ? id : null;
  } catch { return null; }
}

async function fetchMe(initData?: string) {
  let endpoint = '/api/me';
  const headers: Record<string, string> = {};
  if (initData) headers['x-init-data'] = initData;
  else if (DEBUG) {
    const id = getDebugId();
    if (id) endpoint = `/api/me?id=${encodeURIComponent(id)}`;
  }
  const r = await fetch(endpoint, { method: 'POST', headers });
  return r.json().catch(()=>({ ok:false }));
}

export default function LibraryCategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const cat = CATEGORIES_MAP[slug];
  const docs = useMemo<DocItem[]>(() => getDocsByCategory(slug), [slug]);

  const [pro, setPro] = useState(false);
  const [used, setUsed] = useState<string[]>([]);
  const left = Math.max(0, FREE_LIMIT - used.length);

  useEffect(() => {
    try {
      const tg: any = (window as any)?.Telegram?.WebApp;
      tg?.ready?.(); tg?.expand?.();
      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(() => { history.back(); });

      const initData = tg?.initData || '';
      fetchMe(initData).then((data) => {
        setPro(Boolean(data?.subscription?.active));
      });

      // загрузим уже открытые за сегодня id
      setUsed(JSON.parse(localStorage.getItem('jr.free.v1.' + new Date().toISOString().slice(0,10)) || '[]') || []);

      return () => { tg?.BackButton?.hide?.(); };
    } catch {}
  }, []);

  if (!cat) return notFound();

  async function openDoc(d: DocItem) {
    // если Pro — открываем без ограничений
    if (pro) {
      window.open(d.url, '_blank');
      return;
    }
    const opened = wasOpenedToday(d.id);
    const todayUsed = (JSON.parse(localStorage.getItem('jr.free.v1.' + new Date().toISOString().slice(0,10)) || '[]') || []) as string[];
    if (opened || todayUsed.length < FREE_LIMIT) {
      markOpenedToday(d.id); // idемпотентно
      setUsed((u) => Array.from(new Set([...u, d.id])));
      window.open(d.url, '_blank');
    } else {
      alert('Лимит на сегодня исчерпан. Оформите подписку Pro для безлимита.');
    }
  }

  return (
    <main>
      <div className="safe" style={{ maxWidth: 680, margin: '0 auto', padding: 20 }}>
        <h1 style={{ textAlign: 'center' }}>{cat.title}</h1>
        {!pro && (
          <p style={{ opacity: .7, textAlign: 'center', marginTop: -4 }}>
            Сегодня бесплатно: <b>{left}</b> документ(а).{' '}
            <Link href="/pro" style={{ textDecoration: 'underline' }}>Pro — без лимита</Link>.
          </p>
        )}

        <div style={{ display:'grid', gap:12, marginTop:16 }}>
          {docs.map((d) => {
            const already = wasOpenedToday(d.id);
            const locked = !pro && !already && used.length >= FREE_LIMIT;
            return (
              <button key={d.id} className="list-btn" onClick={()=>openDoc(d)}
                disabled={false}
                style={{
                  width:'100%', textAlign:'left', border:'1px solid #333', borderRadius:12,
                  padding:'12px 16px', background:'transparent', color:'inherit',
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  opacity: locked ? .7 : 1
                }}>
                <span className="list-btn__left" style={{ display:'flex', gap:10, alignItems:'center' }}>
                  <span className="list-btn__emoji" aria-hidden="true">{d.emoji}</span>
                  <span style={{ display:'grid' }}>
                    <b>{d.title}</b>
                    <span style={{ opacity:.6, fontSize:12 }}>
                      обновлено {d.updatedAt?.slice(0,10) || '—'}
                    </span>
                  </span>
                </span>
                <span className="list-btn__right" aria-hidden="true" style={{display:'flex', gap:10}}>
                  {!pro && (locked ? '🔒' : '✓')}
                  <span className="list-btn__chev">›</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
