'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan, Tier } from '@/lib/pricing';
import { getPrices, planBadges } from '@/lib/pricing';

const tier: Tier = 'PRO';

// короткие подписи вместо длинных «LiveManager…»
const TITLES: Record<Plan, string> = {
  WEEK: 'Pro — неделя',
  MONTH: 'Pro — месяц',
  HALF_YEAR: 'Pro — полгода',
  YEAR: 'Pro — год',
};

export default function ProMinPage() {
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
      <div
        className="safe"
        style={{
          maxWidth: 600,  // шире контейнер
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          padding: 20,
        }}
      >
        {/* Кнопка «Назад» того же стиля */}
        <button
          type="button"
          onClick={() => (document.referrer ? history.back() : (window.location.href = '/pro'))}
          className="list-btn"
          style={{
            width: 120,
            padding: '10px 14px',
            borderRadius: 12,
            background: '#171a21',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
          <span style={{ fontWeight: 600 }}>Назад</span>
        </button>

        <h1 style={{ textAlign: 'center' }}>LiveManager Pro — оплата</h1>
        {msg && <p style={{ color: 'crimson', textAlign: 'center' }}>{msg}</p>}
        {info && <p style={{ opacity: .7, textAlign: 'center' }}>{info}</p>}

        <div style={{ display: 'grid', gap: 12 }}>
          {entries.map(([key, cfg]) => {
            const can = !busy || busy === key;
            const badges = planBadges(tier, key); // «популярно/выгодно»

            return (
              <button
                key={key}
                disabled={!can}
                onClick={() => buy(key)}
                className="list-btn"
                style={{
                  // одинаковая ширина и строгая сетка
                  width: '100%',
                  border: '1px solid #333',
                  borderRadius: 14,
                  padding: '16px 18px',
                  opacity: can ? 1 : .6,
                  display: 'grid',
                  gridTemplateColumns: '1fr 120px', // правая колонка фикс
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {/* Левая колонка */}
                <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span className="list-btn__emoji" aria-hidden>🟣</span>
                  <b style={{ whiteSpace: 'nowrap' }}>{TITLES[key]}</b>
                  {/* компактные шильдики */}
                  {badges.map((b, i) => (
                    <span
                      key={i}
                      className={b.className}
                      style={{
                        marginLeft: 6,
                        fontSize: 11,
                        lineHeight: 1,
                        padding: '3px 6px',
                        borderRadius: 999,
                        background: '#2b2f43',
                        color: '#8aa0ff',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.text}
                    </span>
                  ))}
                </span>

                {/* Правая колонка — табличные цифры, не «гуляют» */}
                <span
                  className="list-btn__right"
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 8,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  <span>{cfg.amount}</span>
                  <span aria-hidden>⭐</span>
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
