'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan } from '@/lib/pricing';
import { getPrices, planBadges } from '@/lib/pricing';

export default function ProMinPage() {
  const tier = 'pro' as const;
  const PRICES = useMemo(() => getPrices(tier), []);
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tg: any = (window as any).Telegram?.WebApp;
      tg?.ready?.(); tg?.expand?.();
      tg?.BackButton?.show?.();
      const back = () => { if (document.referrer) history.back(); else window.location.href = '/'; };
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
      const res = await fetch(`/api/createInvoice?plan=${encodeURIComponent(plan)}&tier=${tier}`, { method: 'POST' });
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

  const plans = useMemo(
    () =>
      (['WEEK','MONTH','HALF_YEAR','YEAR'] as Plan[])
        .map((p) => ({ key: p, cfg: PRICES[p] }))
        .sort((a, b) => a.cfg.days - b.cfg.days),
    [PRICES]
  );

  return (
    <main>
      <div className="safe" style={{ maxWidth: 560, margin: '0 auto', display:'flex', flexDirection:'column', gap:12, padding:20 }}>
        <h1 style={{ textAlign:'center' }}>LiveManager Pro</h1>
        {msg &&  <p style={{ color:'crimson', textAlign:'center' }}>{msg}</p>}
        {info && <p style={{ opacity:.7, textAlign:'center' }}>{info}</p>}

        <div style={{ display:'grid', gap:12 }}>
          {plans.map(({ key, cfg }) => {
            const can = !busy || busy === key;
            const badges = planBadges(tier, key);
            return (
              <button
                key={key}
                disabled={!can}
                className="list-btn"
                style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  border:'1px solid #333', borderRadius:12, padding:'12px 16px',
                  opacity: can ? 1 : .6
                }}
                onClick={() => buy(key)}
              >
                <span className="list-btn__left" style={{ gap:12 }}>
                  <span className="list-btn__emoji">⭐</span>
                  <span style={{ display:'grid' }}>
                    <b>{cfg.title}</b>
                    <span style={{ display:'flex', gap:6, marginTop:2 }}>
                      {badges.map((b, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize:12, padding:'2px 6px', borderRadius:6,
                            background: b.includes('%') ? 'rgba(91,140,255,.12)' : 'rgba(255,255,255,.08)',
                            border: `1px solid ${b.includes('%') ? '#5b8cff' : '#555'}`,
                            color: b.includes('%') ? '#9bb7ff' : '#ddd'
                          }}
                        >
                          {b}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
                <span className="list-btn__right">
                  <span>{cfg.amount} ⭐</span>
                  <span className="list-btn__chev">›</span>
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop:'auto' }}>
          <p style={{ fontSize:12, opacity:.55, textAlign:'center', marginTop:24 }}>
            Подтверждая, вы соглашаетесь с <a href="/terms" style={{ textDecoration:'underline' }}>условиями подписки</a>.
          </p>
          <p style={{ fontSize:12, opacity:.55, textAlign:'center' }}>
            Также ознакомьтесь с <a href="/legal" style={{ textDecoration:'underline' }}>правовой информацией</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
