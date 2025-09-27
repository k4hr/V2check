// app/pro/max/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan, Tier } from '@/lib/pricing';
import { getPrices, planBadges } from '@/lib/pricing';

const tier: Tier = 'PROPLUS';

export default function ProMaxPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const prices = useMemo(() => getPrices(tier), []);

  useEffect(() => {
    const w: any = window;
    const tg = w?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    try {
      tg?.BackButton?.show?.();
      const back = () => { if (document.referrer) history.back(); else window.location.href = '/pro'; };
      tg?.BackButton?.onClick?.(back);
      const onClosed = (d: any) => {
        if (d?.status === 'paid') {
          try { tg?.HapticFeedback?.impactOccurred?.('medium'); } catch {}
          setInfo('Оплата подтверждена. Обновляем статус…');
          setTimeout(() => { window.location.href = '/cabinet'; }, 400);
        } else {
          setInfo('Окно оплаты закрыто. Если оплата прошла — проверьте статус в кабинете.');
        }
        setBusy(null);
      };
      tg?.onEvent?.('invoiceClosed', onClosed);
      return () => { tg?.BackButton?.hide?.(); tg?.offEvent?.('invoiceClosed', onClosed); };
    } catch {}
  }, []);

  async function buy(plan: Plan) {
    if (busy) return;
    setBusy(plan); setMsg(null); setInfo(null);
    try {
      const res = await fetch(`/api/createInvoice?tier=${tier}&plan=${plan}`, { method: 'POST' });
      const { ok, link, error } = await res.json();
      if (!ok || !link) throw new Error(error || 'createInvoiceLink failed');

      const tg: any = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice) tg.openInvoice(link, () => {});
      else if (tg?.openTelegramLink) tg.openTelegramLink(link);
      else window.location.href = link;
    } catch (e: any) {
      setMsg(e?.message || 'Неизвестная ошибка');
    } finally {
      setTimeout(() => setBusy(null), 1200);
    }
  }

  const entries = Object.entries(prices) as [Plan, typeof prices[Plan]][];

  return (
    <main>
      <div className="safe" style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
        <h1 style={{ textAlign: 'center' }}>LiveManager Pro+ — оплата</h1>
        {msg && <p style={{ color: 'crimson', textAlign: 'center' }}>{msg}</p>}
        {info && <p style={{ opacity: .7, textAlign: 'center' }}>{info}</p>}

        <div style={{ display:'grid', gap:12 }}>
          {entries.map(([key, cfg]) => {
            const can = !busy || busy === key;
            const badges = planBadges(tier, key);
            return (
              <button
                key={key}
                disabled={!can}
                className="list-btn"
                onClick={() => buy(key)}
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #333', borderRadius:12, padding:'12px 16px', opacity: can ? 1 : .6 }}
              >
                <span className="list-btn__left">
                  <span className="list-btn__emoji">✨</span>
                  <b>{cfg.title}</b>
                  {badges.map((b,i)=>(
                    <span key={i} className={b.className} style={{ marginLeft:8, fontSize:12, padding:'2px 8px', borderRadius:999, background:'#3a3424', color:'#f6c454' }}>{b.text}</span>
                  ))}
                </span>
                <span className="list-btn__right">
                  <span>{cfg.amount} ⭐</span>
                  <span className="list-btn__chev">›</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <p style={{ fontSize: 12, opacity: .55, textAlign: 'center', marginTop: 24 }}>
            Подтверждая, вы соглашаетесь с <a href="/terms" style={{ textDecoration: 'underline' }}>условиями подписки</a>.
          </p>
          <p style={{ fontSize: 12, opacity: .55, textAlign: 'center' }}>
            Также ознакомьтесь с <a href="/legal" style={{ textDecoration: 'underline' }}>правовой информацией</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
