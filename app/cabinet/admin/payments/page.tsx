// app/cabinet/admin/payments/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { STARS_TO_TON } from '@/lib/ton';
import type { Plan, Tier } from '@/lib/pricing';

type Row = {
  id: string;
  createdAt: string;
  telegramId: string | null;
  tier: Tier;
  plan: Plan;

  // либо «звёзды», либо «рубли»
  amountStars?: number;        // для stars
  amountKopecks?: number;      // для RUB
  currency: string | null;

  days: number | null;
  providerPaymentChargeId: string | null; // invoiceId / paymentId
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
  const [currency, setCurrency] = useState('');  // оставим для совместимости
  const [source, setSource] = useState<'all'|'stars'|'card'>('all'); // НОВОЕ

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

  useEffect(()=>{ try{ (window as any)?.Telegram?.WebApp?.ready?.(); }catch{} load(1); /* eslint-disable-next-line */ }, []);

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
      <div style={{ display:'grid', gap:10, padding:14, border:'1px solid var(--border)', borderRadius:14, background:'#111722' }}>
        <div style={{ display:'grid', gap:10, gridTemplateColumns:'1fr 1fr', alignItems:'center' }}>
          <input placeholder="Поиск: tg id / payload / invoice id / payment id" value={q} onChange={e=>setQ(e.target.value)}
            style={{ height:38, borderRadius:10, border:'1px solid #2b3552', background:'#121722', padding:'0 10px' }} />
          <div style={{ display:'flex', gap:8 }}>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
              style={{ height:38, borderRadius:10, border:'1px solid #2b3552', background:'#121722', padding:'0 10px' }} />
            <input type="date" value={to} onChange={e=>setTo(e.target.value)}
              style={{ height:38, borderRadius:10, border:'1px solid #2b3552', background:'#121722', padding:'0 10px' }} />
          </div>
        </div>

        <div style={{ display:'grid', gap:8, gridTemplateColumns:'repeat(4, 1fr)' }}>
          <select value={tier} onChange={e=>setTier(e.target.value as any)}
            style={{ height:38, borderRadius:10, border:'1px solid #2b3552', background:'#121722', padding:'0 10px' }}>
            <option value="">Тариф: все</option>
            <option value="PRO">Pro</option>
            <option value="PROPLUS">Pro+</option>
          </select>
          <select value={plan} onChange={e=>setPlan(e.target.value as any)}
            style={{ height:38, borderRadius:10, border:'1px solid #2b3552', background:'#121722', padding:'0 10px' }}>
            <option value="">План: все</option>
            <option value="WEEK">Неделя</option>
            <option value="MONTH">Месяц</option>
            <option value="HALF_YEAR">Полгода</option>
            <option value="YEAR">Год</option>
          </select>
          <select value={source} onChange={e=>setSource(e.target.value as any)}
            style={{ height:38, borderRadius:10, border:'1px solid #2b3552', background:'#121722', padding:'0 10px' }}>
            <option value="all">Источник: все</option>
            <option value="stars">Только Stars</option>
            <option value="card">Только RUB</option>
          </select>
          <select value={currency} onChange={e=>setCurrency(e.target.value)}
            style={{ height:38, borderRadius:10, border:'1px solid #2b3552', background:'#121722', padding:'0 10px' }}>
            <option value="">Валюта (для Stars)</option>
            <option value="TON">TON</option><option value="USDT">USDT</option>
            <option value="USDC">USDC</option><option value="BTC">BTC</option><option value="ETH">ETH</option>
            <option value="CRYPTO">CRYPTO</option>
          </select>
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <button type="button" className="list-btn" onClick={()=>{ haptic('light'); load(1); }}
            style={{ padding:'10px 14px', borderRadius:12 }}>
            Применить фильтры
          </button>
          <button type="button" className="list-btn" onClick={()=>{
            setQ(''); setTier(''); setPlan(''); setCurrency(''); setSource('all');
            const d=new Date(); const f=new Date(); f.setDate(f.getDate()-30);
            setFrom(f.toISOString().slice(0,10)); setTo(d.toISOString().slice(0,10));
            haptic('light'); setTimeout(()=>load(1),0);
          }} style={{ padding:'10px 14px', borderRadius:12, background:'#171a21', border:'1px solid var(--border)' }}>
            Сбросить
          </button>
        </div>
      </div>

      {/* сводка */}
      <div style={{ padding:14, border:'1px solid rgba(120,170,255,.25)', borderRadius:14,
        background:'radial-gradient(140% 140% at 10% 0%, rgba(120,170,255,.14), rgba(255,255,255,.03))' }}>
        <div style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'baseline' }}>
          <b>Всего платежей:</b> <span>{total}</span>
          <b>Сумма (звёзды):</b> <span>{totalStars}</span>
          <b>~ в TON:</b> <span>{approxTon}</span>
        </div>
        {!!byCurrency.length && (
          <div style={{ marginTop:8, opacity:.9 }}>
            По валютам:&nbsp;
            {byCurrency.map((x,i)=>(
              <span key={x.currency}>{i>0 && ', '}{x.currency}: {x.stars}</span>
            ))}
          </div>
        )}
      </div>

      {err && <p style={{ color:'#ff5c7a' }}>Ошибка: {err}</p>}
      {loading && <p style={{ opacity:.7 }}>Загружаем…</p>}

      {/* список */}
      <div style={{ display:'grid', gap:10 }}>
        {rows.map(row => {
          const isCard = row.source === 'card';
          return (
            <div key={row.id} style={{
              border:'1px solid #333', borderRadius:14, padding:12, background:'#121621', display:'grid', gap:6
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
                <b>{row.tier === 'PROPLUS' ? 'Pro+' : 'Pro'} · {labelPlan(row.plan)} {isCard ? '· RUB' : ''}</b>
                <span style={{ opacity:.8 }}>{fmtDateTime(row.createdAt)}</span>
              </div>

              <div style={{ display:'flex', gap:12, flexWrap:'wrap', opacity:.95 }}>
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
        {!loading && rows.length === 0 && <p style={{ opacity:.7 }}>Нет данных.</p>}
      </div>

      {/* пагинация */}
      {pages > 1 && (
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
          <button className="list-btn" disabled={page<=1}
            onClick={()=>{ if(page>1){ haptic('light'); load(page-1); } }}
            style={{ padding:'10px 14px', borderRadius:12 }}>← Назад</button>
          <div style={{ opacity:.8 }}>Стр. {page} / {pages}</div>
          <button className="list-btn" disabled={page>=pages}
            onClick={()=>{ if(page<pages){ haptic('light'); load(page+1); } }}
            style={{ padding:'10px 14px', borderRadius:12 }}>Вперёд →</button>
        </div>
      )}
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
