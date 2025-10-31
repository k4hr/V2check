/* path: app/cabinet/admin/users/page.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}
type Totals = {
  totalUsers: number;
  active24h: number;
  active7d: number;
  newToday: number;
  new7d: number;
  subsActive: number;
  subsPro: number;
  subsProPlus: number;
  subsExpired: number;
};
type RecentRow = {
  telegramId: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  plan?: string | null;
  subscriptionUntil?: string | null;
  createdAt: string;
  lastSeenAt?: string | null;
};
type Resp = { ok: boolean; at?: string; totals?: Totals; recent?: RecentRow[]; error?: string };

const fmtDate = (s?: string | null) => s ? new Date(s).toLocaleString() : '—';
const fmtPlan = (p?: string | null) => p === 'PROPLUS' ? 'Pro+' : (p === 'PRO' ? 'Pro' : '—');

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const debugId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? id : '';
    } catch { return ''; }
  }, []);

  async function load() {
    setLoading(true); setErr(null);
    try {
      const headers: Record<string,string> = {};
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      if (initData) headers['x-init-data'] = initData;

      const url = debugId ? `/api/admin/stats?id=${encodeURIComponent(debugId)}` : '/api/admin/stats';
      const r = await fetch(url, { headers, cache: 'no-store' });
      const data: Resp = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'LOAD_FAILED');

      setTotals(data.totals || null);
      setRecent(data.recent || []);
      setUpdatedAt(data.at || null);
    } catch (e:any) {
      setErr(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try { (window as any)?.Telegram?.WebApp?.ready?.(); } catch {}
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="safe" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link
          href={debugId ? { pathname: '/cabinet/admin', query: { id: debugId } } : '/cabinet/admin'}
          className="list-btn" onClick={() => haptic('light')}
          style={{ width: 120, textDecoration: 'none' }}
        >
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Admin · Пользователи</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="list-btn" onClick={() => { haptic('light'); load(); }}
                  style={{ padding: '10px 14px', borderRadius: 12 }}>
            Обновить
          </button>
        </div>
      </div>

      {err && <p style={{ color:'#ff5c7a' }}>Ошибка: {err}</p>}
      {updatedAt && <div style={{ opacity:.65, marginTop: -6 }}>Обновлено: {fmtDate(updatedAt)}</div>}

      {/* KPI */}
      <div style={{
        display:'grid', gap:10,
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))'
      }}>
        {totals && (
          <>
            <Kpi title="Всего пользователей"  value={totals.totalUsers} />
            <Kpi title="Актив за 24ч"        value={totals.active24h} />
            <Kpi title="Актив за 7д"         value={totals.active7d} />
            <Kpi title="Новые сегодня"       value={totals.newToday} />
            <Kpi title="Новые за 7д"         value={totals.new7d} />
            <Kpi title="Активные подписки"   value={totals.subsActive} />
            <Kpi title="Pro активны"         value={totals.subsPro} />
            <Kpi title="Pro+ активны"        value={totals.subsProPlus} />
            <Kpi title="Подписка истекла"    value={totals.subsExpired} />
          </>
        )}
      </div>

      {/* Недавние регистрации */}
      <section style={{
        border:'1px solid var(--border)', borderRadius:14, background:'#111722',
        boxShadow: '0 10px 26px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04)'
      }}>
        <div style={{ padding:'12px 14px', borderBottom:'1px solid #2b3552', display:'flex', alignItems:'baseline', gap:10 }}>
          <h3 style={{ margin:0 }}>Последние 25 пользователей</h3>
          <span style={{ opacity:.65 }}>(по дате регистрации)</span>
        </div>
        <div style={{ padding:12, overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
            <thead>
              <tr style={{ textAlign:'left', opacity:.7 }}>
                <th style={{ padding:'6px 8px' }}>Telegram</th>
                <th style={{ padding:'6px 8px' }}>Имя</th>
                <th style={{ padding:'6px 8px' }}>План</th>
                <th style={{ padding:'6px 8px' }}>Активна до</th>
                <th style={{ padding:'6px 8px' }}>Создан</th>
                <th style={{ padding:'6px 8px' }}>Был(а)</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u, i) => (
                <tr key={i} style={{ borderTop:'1px solid rgba(255,255,255,.06)' }}>
                  <td style={{ padding:'8px' }}>
                    <code style={{ opacity:.9 }}>{u.telegramId}</code>
                    {u.username && <span style={{ opacity:.7 }}> · @{u.username}</span>}
                  </td>
                  <td style={{ padding:'8px' }}>
                    {(u.firstName || u.lastName) ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '—'}
                  </td>
                  <td style={{ padding:'8px' }}>
                    <Badge kind={u.plan === 'PROPLUS' ? 'gold' : u.plan === 'PRO' ? 'blue' : 'gray'}>
                      {fmtPlan(u.plan)}
                    </Badge>
                  </td>
                  <td style={{ padding:'8px' }}>{fmtDate(u.subscriptionUntil)}</td>
                  <td style={{ padding:'8px' }}>{fmtDate(u.createdAt)}</td>
                  <td style={{ padding:'8px' }}>{fmtDate(u.lastSeenAt)}</td>
                </tr>
              ))}
              {!recent.length && (
                <tr><td colSpan={6} style={{ padding:'10px 8px', opacity:.7 }}>Нет данных.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div style={{
      padding:14, border:'1px solid rgba(120,170,255,.25)', borderRadius:14,
      background:'radial-gradient(140% 140% at 10% 0%, rgba(120,170,255,.14), rgba(255,255,255,.03))',
      boxShadow: '0 10px 26px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04)'
    }}>
      <div style={{ opacity:.85 }}>{title}</div>
      <div style={{ fontSize:26, fontWeight:800, lineHeight:1.1 }}>{value}</div>
    </div>
  );
}

function Badge({ children, kind }:{ children: any; kind: 'gold'|'blue'|'gray' }) {
  const styleMap: Record<typeof kind, React.CSSProperties> = {
    gold: { background:'#3a2d12', border:'1px solid #caa86a' },
    blue: { background:'rgba(76,130,255,.18)', border:'1px solid rgba(120,170,255,.35)' },
    gray: { background:'#2a2f45', border:'1px solid rgba(255,255,255,.12)' },
  };
  return (
    <span style={{
      display:'inline-block', padding:'2px 8px', borderRadius:999, fontSize:12, whiteSpace:'nowrap',
      ...styleMap[kind],
    }}>{children}</span>
  );
}
