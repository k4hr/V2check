'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan, Tier } from '@/lib/pricing';
import { getPrices } from '@/lib/pricing';

const tier: Tier = 'PRO';

const TITLES: Record<Plan, string> = {
  WEEK: 'Pro — Неделя',
  MONTH: 'Pro — Месяц',
  HALF_YEAR: 'Pro — Полгода',
  YEAR: 'Pro — Год',
};

export default function ProMinPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cpPlan, setCpPlan] = useState<Plan>('MONTH'); // план для Crypto Pay

  const prices = useMemo(() => getPrices(tier), []);

  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    try {
      tg?.BackButton?.show?.();
      const back = () => { if (document.referrer) history.back(); else window.location.href = '/pro'; };
      tg?.BackButton?.onClick?.(back);
      return () => { tg?.BackButton?.hide?.(); tg?.offEvent?.('invoiceClosed', back); };
    } catch {}
  }, []);

  async function buyCrypto(plan: Plan) {
    setMsg(null); setInfo(null);
    try {
      const r = await fetch(`/api/pay/cryptopay/createInvoice?tier=${tier}&plan=${plan}`, { method: 'POST' });
      const data = await r.json().catch(() => ({} as any));
      if (!data?.ok || !data?.link) throw new Error(data?.error || 'cryptopay:createInvoice failed');
      const tg: any = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) tg.openTelegramLink(data.link);
      else window.location.href = data.link;
      setInfo('Счёт открыт в Crypto Bot. После оплаты вернитесь и проверьте статус в кабинете.');
    } catch (e: any) {
      setMsg(String(e?.message || 'Ошибка Crypto Pay'));
    }
  }

  async function buyStars(plan: Plan) {
    if (busy) return;
    setBusy(plan); setMsg(null); setInfo(null);
    try {
      const res = await fetch(`/api/createInvoice?tier=${tier}&plan=${plan}`, { method: 'POST' });
      const { ok, link, error } = await res.json().catch(() => ({} as any));
      if (!ok || !link) throw new Error(error || 'createInvoiceLink failed');
      const tg: any = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice) tg.openInvoice(link, () => {});
      else if (tg?.openTelegramLink) tg.openTelegramLink(link);
      else window.location.href = link;
      setInfo('Открыл окно оплаты Stars. Если закроете — статус можно проверить в кабинете.');
    } catch (e: any) {
      // авто-фоллбек в Crypto Pay
      setMsg('Stars недоступно, пробуем Crypto Pay…');
      await buyCrypto(plan);
    } finally {
      setTimeout(() => setBusy(null), 800);
    }
  }

  const entries = Object.entries(prices) as [Plan, typeof prices[Plan]][];

  return (
    <main>
      <div className="safe" style={{ maxWidth: 600, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14, padding: 20 }}>
        {/* Назад */}
        <button
          type="button"
          onClick={() => (document.referrer ? history.back() : (window.location.href = '/pro'))}
          className="list-btn"
          style={{ width: 120, padding: '10px 14px', borderRadius: 12, background: '#171a21', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          <span style={{ fontWeight: 600 }}>Назад</span>
        </button>

        <h1 style={{ textAlign: 'center' }}>LiveManager Pro — оплата</h1>
        {msg && <p style={{ color: 'crimson', textAlign: 'center' }}>{msg}</p>}
        {info && <p style={{ opacity: .7, textAlign: 'center' }}>{info}</p>}

        {/* Оплата Stars (по клику на строке) */}
        <div style={{ display: 'grid', gap: 12 }}>
          {entries.map(([key, cfg]) => {
            const can = !busy || busy === key;
            return (
              <button
                key={key}
                disabled={!can}
                onClick={() => buyStars(key)}
                className="list-btn"
                style={{
                  width: '100%',
                  border: '1px solid #333',
                  borderRadius: 14,
                  padding: '14px 18px',
                  opacity: can ? 1 : .6,
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px',
                  alignItems: 'center',
                  columnGap: 12,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span className="list-btn__emoji" aria-hidden>🟣</span>
                  <b style={{ whiteSpace: 'nowrap' }}>{TITLES[key]}</b>
                </span>
                <span className="list-btn__right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontVariantNumeric: 'tabular-nums' }}>
                  <span>{cfg.amount}</span>
                  <span aria-hidden>🪙</span>
                  <span className="list-btn__chev">›</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Блок Crypto Pay: выбор плана + отдельная яркая кнопка */}
        <div style={{
          marginTop: 10,
          padding: 12,
          borderRadius: 14,
          border: '1px solid rgba(120,150,255,.25)',
          background: '#141823'
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {(['WEEK','MONTH','HALF_YEAR','YEAR'] as Plan[]).map(p => (
              <button
                key={p}
                onClick={() => setCpPlan(p)}
                className="list-btn"
                style={{
                  padding: '8px 10px',
                  borderRadius: 10,
                  border: cpPlan === p ? '1px solid rgba(120,150,255,.9)' : '1px solid rgba(255,255,255,.1)',
                  background: cpPlan === p ? 'rgba(120,150,255,.1)' : '#0f1320',
                  fontSize: 13
                }}
              >
                {TITLES[p as Plan].replace('Pro — ','')}
              </button>
            ))}
          </div>

          <button
            onClick={() => buyCrypto(cpPlan)}
            className="list-btn"
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: 14,
              border: '1px solid rgba(120,150,255,.45)',
              boxShadow: '0 10px 30px rgba(120,150,255,.18), inset 0 0 0 1px rgba(120,150,255,.10)',
              background: '#171a21',
              fontWeight: 800,
            }}
          >
            Оплата через Crypto Pay
          </button>
        </div>
      </div>
    </main>
  );
}
