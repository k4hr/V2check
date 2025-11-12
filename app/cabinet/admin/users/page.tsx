// app/cabinet/admin/users/page.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

/* ===== ТЕМА ИЗ TELEGRAM (та же, что на payments) ===== */
function hexToRgb(hex?: string){ if(!hex) return [0,0,0]; const h=hex.replace('#',''); return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)) as any; }
function isDark(hex?:string){ const [r,g,b]=hexToRgb(hex); const L=(0.299*r+0.587*g+0.114*b)/255; return L<0.5; }
function applyTgTheme(){
  const tg:any = (window as any)?.Telegram?.WebApp;
  const p = tg?.themeParams || {};
  const dark = p.bg_color ? isDark(p.bg_color) : matchMedia('(prefers-color-scheme: dark)').matches;

  const vars: Record<string,string> = {
    '--bg':    p.bg_color            || (dark ? '#0f121b' : '#f7f9ff'),
    '--fg':    p.text_color          || (dark ? '#eef2ff' : '#0f172a'),
    '--panel': p.secondary_bg_color  || (dark ? '#161c2b' : '#ffffff'),
    '--panel-weak':                  dark ? '#121826' : '#f2f6ff',
    '--border':                      dark ? 'rgba(255,255,255,.12)' : 'rgba(15,23,42,.14)',
    '--accent': p.button_color       || '#4c82ff',
  };
  Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  try { tg?.setHeaderColor?.('secondary_bg_color'); tg?.setBackgroundColor?.(vars['--bg']); } catch {}
}
function ThemeCSS(){
  return (
    <style jsx global>{`
      :root{
        --bg:#f7f9ff; --fg:#0f172a; --panel:#ffffff; --panel-weak:#f2f6ff; --border:rgba(15,23,42,.14); --accent:#4c82ff;
      }
      body{ background:var(--bg); color:var(--fg); }
      .list-btn{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        padding:12px 14px; border-radius:12px; font-weight:800;
        background:var(--panel); color:var(--fg); border:1px solid var(--border);
      }
      .section{
        border:1px solid var(--border); border-radius:14px; background:var(--panel);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,.04);
      }
      .kpi{
        padding:14px; border-radius:14px; border:1px solid var(--border);
        background: color-mix(in oklab, var(--panel) 86%, transparent);
      }
      .muted{ opacity:.85 }
      table{ width:100%; border-collapse:collapse; }
      thead tr{ opacity:.7; text-align:left; }
      td, th{ padding:6px 8px; border-top:1px solid color-mix(in oklab, var(--border) 60%, transparent); }
      code{ background: color-mix(in oklab, var(--panel-weak) 70%, transparent); padding:0 4px; border-radius:6px; }
      .badge{ display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; white-space:nowrap; }
      .badge--gold{ background:#3a2d12; border:1px solid #caa86a; }
      .badge--blue{ background:color-mix(in oklab, var(--accent) 18%, transparent); border:1px solid color-mix(in oklab, var(--accent) 40%, var(--border)); }
      .badge--gray{ background:#2a2f45; border:1px solid rgba(255,255,255,.12); }
    `}</style>
  );
}
/* ===== конец темы ===== */

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
    const tg:any = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); } catch {}
    applyTgTheme();
    const onTheme = () => applyTgTheme();
    try { tg?.onEvent?.('themeChanged', onTheme); } catch {}
    load();
    return () => { try { tg?.offEvent?.('themeChanged', onTheme); } catch {} };
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
          <button className="list-btn" onClick={() => { haptic('light'); load(); }}>
            Обновить
          </button>
        </div>
      </div>

      {err && <p style={{ color: '#ff5c7a' }}>Ошибка: {err}</p>}
      {updatedAt && <div className="muted" style={{ marginTop: -6 }}>Обновлено: {fmtDate(updatedAt)}</div>}

      {/* KPI */}
      <div style={{ display:'grid', gap:10, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
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
      <section className="section">
        <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'baseline', gap:10 }}>
          <h3 style={{ margin:0 }}>Последние 25 пользователей</h3>
          <span className="muted">(по дате регистрации)</span>
        </div>
        <div style={{ padding:12, overflowX:'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Telegram</th>
                <th>Имя</th>
                <th>План</th>
                <th>Активна до</th>
                <th>Создан</th>
                <th>Был(а)</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((u, i) => (
                <tr key={i}>
                  <td><code>{u.telegramId}</code>{u.username && <span className="muted"> · @{u.username}</span>}</td>
                  <td>{(u.firstName || u.lastName) ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() : '—'}</td>
                  <td>
                    <Badge kind={u.plan === 'PROPLUS' ? 'gold' : u.plan === 'PRO' ? 'blue' : 'gray'}>
                      {fmtPlan(u.plan)}
                    </Badge>
                  </td>
                  <td>{fmtDate(u.subscriptionUntil)}</td>
                  <td>{fmtDate(u.createdAt)}</td>
                  <td>{fmtDate(u.lastSeenAt)}</td>
                </tr>
              ))}
              {!recent.length && (
                <tr><td colSpan={6} className="muted">Нет данных.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ThemeCSS/>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <div className="kpi">
      <div className="muted">{title}</div>
      <div style={{ fontSize:26, fontWeight:800, lineHeight:1.1 }}>{value}</div>
    </div>
  );
}

function Badge({ children, kind }:{ children: any; kind: 'gold'|'blue'|'gray' }) {
  const cls =
    kind === 'gold' ? 'badge badge--gold' :
    kind === 'blue' ? 'badge badge--blue' : 'badge badge--gray';
  return <span className={cls}>{children}</span>;
}
