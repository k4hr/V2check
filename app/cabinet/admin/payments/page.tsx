// app/cabinet/admin/payments/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { STARS_TO_TON } from '@/lib/ton';
import type { Plan, Tier } from '@/lib/pricing';

/* ===== ТЕМА ИЗ TELEGRAM ===== */
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
    '--danger': '#ff5c7a',
  };
  Object.entries(vars).forEach(([k,v])=>document.documentElement.style.setProperty(k,v));
  try { tg?.setHeaderColor?.('secondary_bg_color'); tg?.setBackgroundColor?.(vars['--bg']); } catch {}
}

function ThemeCSS(){
  return (
    <style jsx global>{`
      :root{
        --bg:#f7f9ff; --fg:#0f172a; --panel:#ffffff; --panel-weak:#f2f6ff;
        --border:rgba(15,23,42,.14); --accent:#4c82ff; --danger:#ff5c7a;
      }
      body{ background:var(--bg); color:var(--fg); }
      .list-btn{
        display:flex; align-items:center; justify-content:space-between; gap:10px;
        padding:12px 14px; border-radius:12px; font-weight:800;
        background:var(--panel); color:var(--fg); border:1px solid var(--border);
      }
      .btn-accent{
        background: color-mix(in oklab, var(--accent) 18%, var(--panel));
        border: 1px solid color-mix(in oklab, var(--accent) 60%, var(--border));
      }
      .section{
        padding:14px; border-radius:14px; border:1px solid var(--border);
        background: var(--panel);
      }
      .section-soft{
        padding:14px; border-radius:14px;
        border:1px solid var(--border);
        background: color-mix(in oklab, var(--panel) 86%, transparent);
      }
      input, select, textarea{
        color:var(--fg); background:var(--panel);
        border:1px solid var(--border); border-radius:10px; height:38px; padding:0 10px;
      }
      .muted{ opacity:.85 }
      .card{
        border:1px solid var(--border); border-radius:14px; padding:12px;
        background:var(--panel); display:grid; gap:6;
      }
    `}</style>
  );
}
/* ===== конец темы ===== */

type Row = {
  id: string;
  createdAt: string;
  telegramId: string | null;
  tier: Tier;
  plan: Plan;
  amountStars?: number;
  amountKopecks?: number;
  currency: string | null;
  days: number | null;
  providerPaymentChargeId: string | null;
  payload: string | null;
  source: 'stars' | 'card';
};

type Resp = {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  items: Row[];
  totals: { stars: number; byCurrency: { currency: string; stars: number }[] };
  period: { from: string | null; to: string | null };
  filters: any;
};

function haptic(t:'light'|'medium'='light'){ try{ (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(t);}catch{} }
const fmtDateTime = (s: string) => { const d=new Date(s); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); const hh=String(d.getHours()).padStart(2,'0'); const mi=String(d.getMinutes()).padStart(2,'0'); return `${dd}.${mm}.${yyyy} ${hh}:${mi}`; };
const rub = (k?: number) => typeof k==='number' ? (k/100).toFixed(2).replace('.',',')+' ₽' : '';

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(30);

  // фильтры
  const [q, setQ] = useState('');
  const [tier, setTier] = useState<'' | Tier>('');
  const [plan, setPlan] = useState<'' | Plan>('');
  const [currency, setCurrency] = useState('');
  const [source, setSource] = useState<'all'|'stars'|'card'>('all');

  const [from, setFrom] = useState<string>(() => { const d=new Date(); d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); });
  const [to, setTo] = useState<string>(() => new Date().toISOString().slice(0,10));

  const [totalStars, setTotalStars] = useState(0);
  const [byCurrency, setByCurrency] = useState<{ currency: string; stars: number }[]>([]);

  const debugId = useMemo(() => { try { const u=new URL(window.location.href); const id=u.searchParams.get('id'); return id && /^\d{3,15}$/.test(id) ? id : ''; } catch { return ''; } }, []);

  async function load(p = page) {
    setLoading(true); setErr(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(p));
      params.set('limit', String(limit));
      if (q) params.set('q', q);
      if (tier) params.set('tier', tier);
      if (plan) params.set('plan', plan);
      if (currency) params.set('currency', currency);
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (source) params.set('source', source);
      if (debugId) params.set('id', debugId);

      const headers: Record<string,string> = {};
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      if (initData) headers['x-init-data'] = initData;

      const r = await fetch(`/api/admin/payments?${params.toString()}`, { headers, cache:'no-store' });
      const data: Resp = await r.json();
      if (!data?.ok) throw new Error(data?.error || 'LOAD_FAILED');

      setRows(data.items);
      setTotal(data.total);
      setTotalStars(data.totals.stars || 0);
      setByCurrency(data.totals.byCurrency || []);
      setPage(data.page);
    } catch (e:any) {
      setErr(e?.message || 'Ошибка загрузки');
    } finally { setLoading(false); }
  }

  useEffect(()=>{
    const tg:any = (window as any)?.Telegram?.WebApp;
    try{ tg?.ready?.(); }catch{}
    applyTgTheme();
    const onTheme = () => applyTgTheme();
    try{ tg?.onEvent?.('themeChanged', onTheme); }catch{}
    load(1);
    return ()=>{ try{ tg?.offEvent?.('themeChanged', onTheme); }catch{} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.max(1, Math.ceil(total / limit));
  const approxTon = (totalStars * STARS_TO_TON).toFixed(2);

  return (
    <main className="safe" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href={debugId ? { pathname: '/cabinet/admin', query: { id: debugId } } : '/cabinet/admin'}
          className="list-btn" onClick={() => haptic('light')}
          style={{ width: 120, textDecoration: 'none' }}>
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Admin · Платежи</h1>
      </div>

      {/* фильтры */}
      <div className="section">
        <div style={{ display:'grid', gap:10, gridTemplateColumns:'1fr 1fr', alignItems:'center' }}>
          <input placeholder="Поиск: tg id / payload / invoice id / payment id" value={q} onChange={e=>setQ(e.target.value)} />
          <div style={{ display:'flex', gap:8 }}>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} />
          </div>
        </div>

        <div style={{ display:'grid', gap:8, gridTemplateColumns:'repeat(4, 1fr)', marginTop:10 }}>
          <select value={tier} onChange={e=>setTier(e.target.value as any)}>
            <option value="">Тариф: все</option>
            <option value="PRO">Pro</option>
            <option value="PROPLUS">Pro+</option>
          </select>
          <select value={plan} onChange={e=>setPlan(e.target.value as any)}>
            <option value="">План: все</option>
            <option value="WEEK">Неделя</option>
            <option value="MONTH">Месяц</option>
            <option value="HALF_YEAR">Полгода</option>
            <option value="YEAR">Год</option>
          </select>
          <select value={source} onChange={e=>setSource(e.target.value as any)}>
            <option value="all">Источник: все</option>
            <option value="stars">Только Stars</option>
            <option value="card">Только RUB</option>
          </select>
          <select value={currency} onChange={e=>setCurrency(e.target.value)}>
            <option value="">Валюта (для Stars)</option>
            <option value="TON">TON</option><option value="USDT">USDT</option>
            <option value="USDC">USDC</option><option value="BTC">BTC</option><option value="ETH">ETH</option>
            <option value="CRYPTO">CRYPTO</option>
          </select>
        </div>

        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          <button type="button" className="list-btn btn-accent" onClick={()=>{ haptic('light'); load(1); }}>
            Применить фильтры
          </button>
          <button type="button" className="list-btn" onClick={()=>{
            setQ(''); setTier(''); setPlan(''); setCurrency(''); setSource('all');
            const d=new Date(); const f=new Date(); f.setDate(f.getDate()-30);
            setFrom(f.toISOString().slice(0,10)); setTo(d.toISOString().slice(0,10));
            haptic('light'); setTimeout(()=>load(1),0);
          }}>
            Сбросить
          </button>
        </div>
      </div>

      {/* сводка */}
      <div className="section-soft">
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'baseline' }}>
          <b>Всего платежей:</b> <span>{total}</span>
          <b>Сумма (звёзды):</b> <span>{totalStars}</span>
          <b>~ в TON:</b> <span>{approxTon}</span>
        </div>
        {!!byCurrency.length && (
          <div style={{ marginTop:8 }} className="muted">
            По валютам:&nbsp;
            {byCurrency.map((x,i)=>(
              <span key={x.currency}>{i>0 && ', '}{x.currency}: {x.stars}</span>
            ))}
          </div>
        )}
      </div>

      {err && <p style={{ color:'var(--danger)' }}>Ошибка: {err}</p>}
      {loading && <p className="muted">Загружаем…</p>}

      {/* список */}
      <div style={{ display:'grid', gap:10 }}>
        {rows.map(row => {
          const isCard = row.source === 'card';
          return (
            <div key={row.id} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
                <b>{row.tier === 'PROPLUS' ? 'Pro+' : 'Pro'} · {labelPlan(row.plan)} {isCard ? '· RUB' : ''}</b>
                <span className="muted">{fmtDateTime(row.createdAt)}</span>
              </div>

              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                <span>👤: <b>{row.telegramId || '—'}</b></span>
                {isCard
                  ? <span>Сумма: <b>{rub(row.amountKopecks)}</b></span>
                  : <>
                      <span>⭐: <b>{row.amountStars || 0}</b></span>
                      {!!row.currency && <span>валюта: <b>{row.currency}</b></span>}
                      {!!row.days && <span>дней: <b>{row.days}</b></span>}
                    </>
                }
              </div>

              <div style={{ fontSize:12, opacity:.75, wordBreak:'break-all' }}>
                {row.providerPaymentChargeId && (isCard
                  ? <>paymentId: {row.providerPaymentChargeId}</>
                  : <>invoice: {row.providerPaymentChargeId}</>
                )}
                {row.payload && <> <br/>payload: {row.payload}</>}
              </div>
            </div>
          );
        })}
        {!loading && rows.length === 0 && <p className="muted">Нет данных.</p>}
      </div>

      {/* пагинация */}
      {pages > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
          <button className="list-btn" disabled={page<=1}
            onClick={()=>{ if(page>1){ haptic('light'); load(page-1); } }}>← Назад</button>
          <div className="muted">Стр. {page} / {pages}</div>
          <button className="list-btn" disabled={page>=pages}
            onClick={()=>{ if(page<pages){ haptic('light'); load(page+1); } }}>Вперёд →</button>
        </div>
      )}

      <ThemeCSS/>
    </main>
  );
}

function labelPlan(p: Plan) {
  switch (p) {
    case 'WEEK': return 'Неделя';
    case 'MONTH': return 'Месяц';
    case 'HALF_YEAR': return 'Полгода';
    case 'YEAR': return 'Год';
    default: return String(p);
  }
}
