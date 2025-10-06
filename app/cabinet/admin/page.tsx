'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';
const ADMIN_IDS = String(process.env.NEXT_PUBLIC_ADMIN_TG_IDS || '')
  .split(/[,\s]+/).map(s => s.trim()).filter(Boolean);

type Overview = {
  ok: boolean;
  totals?: { users: number; activeSubs: number; pro: number; proplus: number; payments: number; };
  latestUsers?: { telegramId: string; username?: string | null; plan?: string | null;
                  subscriptionUntil?: string | null; lastSeenAt?: string | null; createdAt: string; }[];
  latestPayments?: { telegramId: string; tier?: string | null; plan?: string | null;
                     amount?: number | null; currency?: string | null; days?: number | null;
                     createdAt: string; }[];
  error?: string;
};

function getCookie(name: string): string {
  try {
    const rows = document.cookie ? document.cookie.split('; ') : [];
    for (const row of rows) {
      const [k, ...rest] = row.split('=');
      if (decodeURIComponent(k) === name) return decodeURIComponent(rest.join('='));
    }
  } catch {}
  return '';
}
function getInitDataFromCookie(): string { return getCookie('tg_init_data'); }

export default function AdminPage() {
  const [ov, setOv] = useState<Overview | null>(null);
  const [err, setErr] = useState('');

  const debugId = useMemo(() => {
    try { const u = new URL(location.href); const id = u.searchParams.get('id'); return id || ''; }
    catch { return ''; }
  }, []);

  const isAdminByClient = useMemo(() => {
    try {
      const WebApp: any = (window as any)?.Telegram?.WebApp;
      const id = WebApp?.initDataUnsafe?.user?.id
        ? String(WebApp.initDataUnsafe.user.id)
        : (DEBUG && debugId) ? debugId : '';
      return ADMIN_IDS.includes(id);
    } catch { return false; }
  }, [debugId]);

  async function load() {
    try {
      setErr('');
      const headers: Record<string, string> = {};
      const init = (window as any)?.Telegram?.WebApp?.initData || getInitDataFromCookie();
      if (init) headers['x-init-data'] = init;

      let url = '/api/admin/overview';
      if (!init && DEBUG && debugId) url += `?id=${encodeURIComponent(debugId)}`;

      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const r = await fetch(url, { method: 'GET', headers, cache: 'no-store', signal: ctrl.signal });
      clearTimeout(t);
      const data: Overview = await r.json();
      if (!data.ok) throw new Error(data.error || 'ACCESS_DENIED');
      setOv(data);
    } catch (e: any) {
      setErr(String(e?.message || 'Ошибка доступа'));
    }
  }

  useEffect(() => {
    try { (window as any)?.Telegram?.WebApp?.ready?.(); } catch {}
    load();
  }, []);

  if (!isAdminByClient) {
    return (
      <main style={{ padding: 20 }}>
        <p style={{ opacity: .8 }}>Доступ запрещён.</p>
        <Link href="/cabinet" className="list-btn" style={{ textDecoration: 'none', display:'inline-block', marginTop: 12 }}>
          ← В кабинет
        </Link>
      </main>
    );
  }

  return (
    <main style={{ padding: 16, maxWidth: 920, margin: '0 auto', display:'grid', gap: 12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/cabinet" className="list-btn" style={{ textDecoration: 'none' }}>
          ← Назад
        </Link>
        <h1>Админ-панель</h1>
        <span />
      </div>

      {err && <div style={{ border:'1px solid #512', background:'#2a1218', padding:10, borderRadius:10 }}>{err}</div>}

      {!ov && !err && <div style={{ opacity:.8 }}>Загружаем сводку…</div>}

      {ov?.totals && (
        <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:10 }}>
          <div className="list-btn"><b>Пользователи</b><div>{ov.totals.users}</div></div>
          <div className="list-btn"><b>Активные</b><div>{ov.totals.activeSubs}</div></div>
          <div className="list-btn"><b>Pro</b><div>{ov.totals.pro}</div></div>
          <div className="list-btn"><b>Pro+</b><div>{ov.totals.proplus}</div></div>
          <div className="list-btn"><b>Платежи</b><div>{ov.totals.payments}</div></div>
        </section>
      )}

      <section style={{ display:'grid', gap:8 }}>
        <h3 style={{ marginBottom: 0 }}>Последние пользователи</h3>
        <div style={{ display:'grid', gap:6 }}>
          {(ov?.latestUsers || []).map((u, i) => (
            <div key={i} className="list-btn" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
              <div>
                <div><b>{u.username ? '@'+u.username : u.telegramId}</b></div>
                <div style={{ opacity:.75, fontSize:13 }}>
                  план: {u.plan || '—'} · до: {u.subscriptionUntil ? u.subscriptionUntil.slice(0,10) : '—'}
                </div>
              </div>
              <div style={{ opacity:.7, fontSize:13 }}>
                {new Date(u.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {!ov?.latestUsers?.length && <div style={{ opacity:.7 }}>Пока пусто</div>}
        </div>
      </section>

      <section style={{ display:'grid', gap:8 }}>
        <h3 style={{ marginBottom: 0 }}>Последние платежи</h3>
        <div style={{ display:'grid', gap:6 }}>
          {(ov?.latestPayments || []).map((p, i) => (
            <div key={i} className="list-btn" style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10 }}>
              <div>
                <div><b>{p.telegramId}</b> · {p.tier || 'PRO'} / {p.plan || '—'}</div>
                <div style={{ opacity:.75, fontSize:13 }}>
                  {p.amount ?? '—'} {p.currency || 'XTR'} · {p.days ?? '—'} дн.
                </div>
              </div>
              <div style={{ opacity:.7, fontSize:13 }}>
                {new Date(p.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
          {!ov?.latestPayments?.length && <div style={{ opacity:.7 }}>Пока пусто</div>}
        </div>
      </section>
    </main>
  );
}
