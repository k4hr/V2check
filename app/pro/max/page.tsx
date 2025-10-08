'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan, Tier } from '@/lib/pricing';
import { getPrices } from '@/lib/pricing';

const tier: Tier = 'PROPLUS';

const TITLES: Record<Plan, string> = {
  WEEK: 'Pro+ — Неделя',
  MONTH: 'Pro+ — Месяц',
  HALF_YEAR: 'Pro+ — Полгода',
  YEAR: 'Pro+ — Год',
};

type PayMethod = 'stars' | 'crypto';

export default function ProMaxPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [method, setMethod] = useState<PayMethod>('stars');

  const prices = useMemo(() => getPrices(tier), []);

  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
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
      const endpoint =
        method === 'crypto'
          ? `/api/pay/cryptopay/createInvoice?tier=${tier}&plan=${plan}`
          : `/api/createInvoice?tier=${tier}&plan=${plan}`;

      const res = await fetch(endpoint, { method: 'POST' });
      const { ok, link, error } = await res.json();
      if (!ok || !link) throw new Error(error || 'createInvoiceLink failed');

      const tg: any = (window as any).Telegram?.WebApp;
      if (tg?.openInvoice && method === 'stars') tg.openInvoice(link, () => {});
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

        <h1 style={{ textAlign: 'center' }}>LiveManager Pro+ — оплата</h1>
        {msg && <p style={{ color: 'crimson', textAlign: 'center' }}>{msg}</p>}
        {info && <p style={{ opacity: .7, textAlign: 'center' }}>{info}</p>}

        <div style={{ display: 'grid', gap: 12 }}>
          {entries.map(([key, cfg]) => {
            const can = !busy || busy === key;
            return (
              <button
                key={key}
                disabled={!can}
                onClick={() => buy(key)}
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
                  <span className="list-btn__emoji" aria-hidden>✨</span>
                  <b style={{ whiteSpace: 'nowrap' }}>{TITLES[key]}</b>
                </span>

                <span className="list-btn__right" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, fontVariantNumeric: 'tabular-nums' }}>
                  <span>{cfg.amount}</span>
                  <span aria-hidden>{method === 'crypto' ? '🪙' : '⭐'}</span>
                  <span className="list-btn__chev">›</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Переключатель метода оплаты вместо текста внизу */}
        <div style={{ marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => setMethod(m => (m === 'stars' ? 'crypto' : 'stars'))}
            style={{
              width: '100%',
              marginTop: 20,
              padding: '14px 16px',
              borderRadius: 14,
              border: '1px solid rgba(255,191,73,.45)',
              background: method === 'crypto'
                ? 'linear-gradient(180deg, rgba(255,210,120,.18), rgba(255,210,120,.06))'
                : 'linear-gradient(180deg, rgba(255,191,73,.18), rgba(255,191,73,.06))',
              boxShadow:
                '0 10px 28px rgba(255,191,73,.18), inset 0 0 0 1px rgba(255,191,73,.10)',
              fontWeight: 700
            }}
          >
            {method === 'crypto' ? 'Оплата через Crypto Pay' : 'Оплата Stars в Telegram'}
          </button>
        </div>
      </div>
    </main>
  );
}
