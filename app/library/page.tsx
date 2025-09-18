'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, type Category } from '@/lib/catalog';

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

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `jr.free.v1.${y}-${m}-${day}`;
}

function getUsedToday(): string[] {
  try {
    const raw = localStorage.getItem(todayKey());
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export default function LibraryRootPage() {
  const [pro, setPro] = useState(false);
  const [hello, setHello] = useState<string | null>(null);
  const used = useMemo(() => getUsedToday(), []);
  const left = Math.max(0, 2 - used.length);

  useEffect(() => {
    try {
      const tg: any = (window as any)?.Telegram?.WebApp;
      tg?.ready?.(); tg?.expand?.();
      setHello(tg?.initDataUnsafe?.user?.first_name || null);
      const initData = tg?.initData || '';
      fetchMe(initData).then((data) => {
        const active = Boolean(data?.subscription?.active);
        setPro(active);
      }).catch(()=>{});
    } catch {}
  }, []);

  return (
    <main>
      <div className="safe" style={{ maxWidth: 680, margin: '0 auto', padding: 20 }}>
        <h1 style={{ textAlign: 'center' }}>Каталог</h1>

        <p style={{ opacity: .7, textAlign: 'center', marginTop: -4 }}>
          {hello ? <>Здравствуйте, <b>{hello}</b>.</> : null} Сегодня бесплатно: <b>{left}</b> документ(а).
          {' '}Для безлимита — <Link href="/pro" style={{ textDecoration: 'underline' }}>оформите Pro</Link>.
        </p>

        <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          {CATEGORIES.map((c: Category) => (
            <Link key={c.slug} href={`/library/${c.slug}`} className="list-btn" style={{
              textDecoration: 'none', border: '1px solid #333', borderRadius: 12, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span className="list-btn__left" style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span className="list-btn__emoji" aria-hidden="true">{c.emoji}</span>
                <b>{c.title}</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
