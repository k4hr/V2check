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

function Star({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M12 2.75l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.98l-5.8 3.06 1.11-6.47-4.7-4.58 6.49-.94L12 2.75z" fill="currentColor" />
    </svg>
  );
}

export default function ProMaxPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Crypto Pay
  const [planCrypto, setPlanCrypto] = useState<Plan>('MONTH');
  const [busyCrypto, setBusyCrypto] = useState(false);

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

  async function buyStars(plan: Plan) {
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

  async function buyCrypto() {
    if (busyCrypto) return;
    setBusyCrypto(true); setMsg(null); setInfo(null);
    try {
      const res = await fetch(`/api/pay/cryptopay/createInvoice?tier=${tier}&plan=${planCrypto}`, { method: 'POST' });
      const { ok, link, error, detail } = await res.json();
      if (!ok || !link) throw new Error(error || detail || 'cryptopay:createInvoice failed');

      const tg: any = (window as any).Telegram?.WebApp;
      if (tg?.openTelegramLink) tg.openTelegramLink(link);
      else window.location.href = link;
    } catch (e: any) {
      setMsg(String(e?.message || 'Crypto Pay error'));
    } finally {
      setBusyCrypto(false);
    }
  }

  const entries = Object.entries(prices) as [Plan, typeof prices[Plan]][];

  return (
    <main>
      <div className="safe">
        {/* Назад */}
        <button
          type="button"
          onClick={() => (document.referrer ? history.back() : (window.location.href = '/pro'))}
          className="back"
        >
          <span>←</span><b>Назад</b>
        </button>

        <h1 className="title">LiveManager Pro+ — оплата</h1>
        {msg && <p className="err">{msg}</p>}
        {info && <p className="info">{info}</p>}

        {/* Stars */}
        <div className="list">
          {entries.map(([key, cfg]) => {
            const can = !busy || busy === key;
            return (
              <button
                key={key}
                disabled={!can}
                onClick={() => buyStars(key)}
                className="row"
                aria-label={`${TITLES[key]} — ${cfg.amount} звёзд`}
              >
                <span className="left">
                  <span className="dot">✨</span>
                  <b className="name">{TITLES[key]}</b>
                </span>
                <span className="right">
                  <span className="price">{cfg.amount}</span>
                  <span className="star" aria-hidden><Star size={16} /></span>
                  <span className="chev">›</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Crypto Pay */}
        <div className="crypto-card">
          <div className="crypto-header">
            <span className="crypto-icon">✨</span>
            <div className="crypto-text">
              <b className="crypto-title">Оплатить через Crypto&nbsp;Pay</b>
              <small className="crypto-sub">TON/USDT — безопасно и быстро</small>
            </div>
          </div>

          <div className="seg">
            {(['WEEK','MONTH','HALF_YEAR','YEAR'] as Plan[]).map(p => (
              <button
                key={p}
                className={`seg__btn ${planCrypto === p ? 'is-active' : ''}`}
                onClick={() => setPlanCrypto(p)}
                type="button"
              >
                {TITLES[p].split('— ')[1]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={buyCrypto}
            disabled={busyCrypto}
            className="crypto-cta"
          >
            {busyCrypto ? 'Создаём счёт…' : `Оплатить (${TITLES[planCrypto].split('— ')[1]})`}
          </button>
        </div>
      </div>

      <style jsx>{`
        .safe { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; padding: 20px; }
        .title { text-align: center; margin: 6px 0 2px; }
        .err { color: #ff4d6d; text-align: center; }
        .info { opacity: .7; text-align: center; }
        .back {
          width: 120px; padding: 10px 14px; border-radius: 12px;
          background:#171a21; border:1px solid var(--border);
          display:flex; align-items:center; gap:8px;
        }
        .list { display: grid; gap: 12px; }
        .row {
          width: 100%; border: 1px solid #333; border-radius: 14px;
          padding: 14px 18px; display: grid; grid-template-columns: 1fr auto;
          align-items: center; column-gap: 12px; background: #121621;
        }
        .left { display:flex; align-items:center; gap:10px; min-width:0; }
        .name { white-space: nowrap; }
        .right { display:flex; justify-content:flex-end; align-items:center; gap:8px; font-variant-numeric: tabular-nums; }
        .star :global(svg){ display:block; }
        .chev { opacity:.6; }

        /* Crypto card (золото, но весь текст белый) */
        .crypto-card {
          margin-top: 6px;
          padding: 14px;
          border-radius: 16px;
          background: radial-gradient(120% 140% at 10% 0%, rgba(255,210,120,.18), rgba(255,255,255,.03));
          border: 1px solid rgba(255,210,120,.30);
          box-shadow: 0 10px 35px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04);
          display:flex; flex-direction:column; gap:12px;
          color:#fff;
        }
        .crypto-header { display:flex; gap:10px; align-items:center; }
        .crypto-icon {
          width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
          background: rgba(255,210,120,.24); border: 1px solid rgba(255,210,120,.36);
          color:#fff;
        }
        .crypto-text { line-height: 1.15; }
        .crypto-title {
          display:block;
          white-space: nowrap;
          color:#fff;
          font-weight: 800;
          letter-spacing: .2px;
        }
        .crypto-sub {
          display:block;
          margin-top: 4px;
          color: rgba(255,255,255,.85);
          font-size: 13px;
        }

        .seg { display:flex; gap:8px; flex-wrap:wrap; }
        .seg__btn {
          padding:8px 12px; border-radius:12px; background:#121722; border:1px solid rgba(255,255,255,.08);
          color:#fff;
        }
        .seg__btn.is-active { border-color: rgba(255,210,120,.7); box-shadow: inset 0 0 0 1px rgba(255,210,120,.35); }
        .crypto-cta {
          width: 100%; padding: 14px 16px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,210,120,.45), rgba(255,191,73,.25));
          border: 1px solid rgba(255,191,73,.55);
          box-shadow: 0 12px 36px rgba(255,191,73,.28);
          font-weight: 700;
          color:#fff;
        }
      `}</style>
    </main>
  );
}
