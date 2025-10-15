/* path: app/pro/min/page.tsx */
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

function Star({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M12 2.75l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.98l-5.8 3.06 1.11-6.47-4.7-4.58 6.49-.94L12 2.75z" fill="currentColor" />
    </svg>
  );
}

export default function ProMinPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // TON
  const [planTon, setPlanTon] = useState<Plan>('MONTH');
  const [busyTon, setBusyTon] = useState(false);

  const prices = useMemo(() => getPrices(tier), []);

  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    try {
      tg?.BackButton?.show?.();
      const back = () => { if (document.referrer) history.back(); else window.location.href = '/pro'; };
      tg?.BackButton?.onClick?.(back);

      // это актуально только для Stars, но оставим на всякий
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

  // Stars (как было)
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

  // TON (новое): создаём deeplink и открываем его напрямую
  async function buyTon() {
    if (busyTon) return;
    setBusyTon(true); setMsg(null); setInfo(null);
    try {
      const res = await fetch(`/api/pay/ton/create?tier=${tier}&plan=${planTon}`, { method: 'POST' });
      const data = await res.json();
      const url: string = data?.payton || data?.deeplink || data?.link || '';

      if (!url) throw new Error('TON_LINK_EMPTY');

      // Важно: НЕ используем Telegram.WebApp.openLink для ton:// — он допускает только http/https.
      try {
        // Пытаемся открыть через смену location — это корректно для deeplink-схем.
        window.location.href = url;
      } catch {
        // Фолбек — в новое окно (на всякий случай)
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (e: any) {
      // Ранее тут «проскакивало» системное сообщение «The string did not match the expected pattern.»
      // Теперь мы не вызываем openLink, поэтому ошибки SDK не будет.
      setMsg(String(e?.message || 'TON: не удалось открыть ссылку'));
    } finally {
      setBusyTon(false);
    }
  }

  const entries = Object.entries(prices) as [Plan, typeof prices[Plan]][];

  return (
    <main>
      <div className="safe">
        <button
          type="button"
          onClick={() => (document.referrer ? history.back() : (window.location.href = '/pro'))}
          className="back"
        >
          <span>←</span><b>Назад</b>
        </button>

        <h1 className="title">LiveManager Pro — оплата</h1>
        {msg && <p className="err">{msg}</p>}
        {info && <p className="info">{info}</p>}

        {/* Оплата Stars */}
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
                  <span className="dot">🟣</span>
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

        {/* Оплата TON */}
        <div className="crypto-card">
          <div className="crypto-header">
            <span className="crypto-icon">💠</span>
            <div className="crypto-text">
              <b className="crypto-title">Оплатить TON</b>
              <small className="crypto-sub">Прямой перевод в кошелёк по ton:// ссылке</small>
            </div>
          </div>

          <div className="seg">
            {(['WEEK','MONTH','HALF_YEAR','YEAR'] as Plan[]).map(p => (
              <button
                key={p}
                className={`seg__btn ${planTon === p ? 'is-active' : ''}`}
                onClick={() => setPlanTon(p)}
                type="button"
              >
                {TITLES[p].split('— ')[1]}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={buyTon}
            disabled={busyTon}
            className="crypto-cta"
          >
            {busyTon ? 'Готовим ссылку…' : `Оплатить (${TITLES[planTon].split('— ')[1]})`}
          </button>
        </div>
      </div>

      <style jsx>{`
        .safe { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; padding: 20px; }
        .title { text-align: center; margin: 6px 0 2px; }
        .err { color: #ff4d6d; text-align: center; }
        .info { opacity: .7; text-align: center; }
        .back { width: 120px; padding: 10px 14px; border-radius: 12px; background:#171a21; border:1px solid var(--border); display:flex; align-items:center; gap:8px; }
        .list { display: grid; gap: 12px; }
        .row { width: 100%; border: 1px solid #333; border-radius: 14px; padding: 14px 18px; display: grid; grid-template-columns: 1fr auto; align-items: center; column-gap: 12px; background: #121621; }
        .left { display:flex; align-items:center; gap:10px; min-width:0; }
        .dot { font-size: 18px; }
        .name { white-space: nowrap; }
        .right { display:flex; justify-content:flex-end; align-items:center; gap:8px; font-variant-numeric: tabular-nums; }
        .star :global(svg){ display:block; }
        .chev { opacity:.6; }

        .crypto-card { margin-top: 6px; padding: 14px; border-radius: 16px;
          background: radial-gradient(120% 140% at 10% 0%, rgba(76,130,255,.12), rgba(255,255,255,.03));
          border: 1px solid rgba(120,170,255,.18);
          box-shadow: 0 10px 35px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04);
          display:flex; flex-direction:column; gap:12px; color: #fff; }
        .crypto-header { display:flex; gap:10px; align-items:center; }
        .crypto-icon { width:34px; height:34px; border-radius:10px; display:grid; place-items:center; background: rgba(120,170,255,.16); border: 1px solid rgba(120,170,255,.22); color:#fff; }
        .crypto-text { line-height: 1.15; }
        .crypto-title { display:block; white-space: nowrap; color:#fff; font-weight: 800; letter-spacing: .2px; }
        .crypto-sub { display:block; margin-top: 4px; color: rgba(255,255,255,.85); font-size: 13px; }

        .seg { display:flex; gap:8px; flex-wrap:wrap; }
        .seg__btn { padding:8px 12px; border-radius:12px; background:#121722; border:1px solid rgba(255,255,255,.08); color:#fff; }
        .seg__btn.is-active { border-color: rgba(120,170,255,.5); box-shadow: inset 0 0 0 1px rgba(120,170,255,.25); }
        .crypto-cta { width: 100%; padding: 14px 16px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(120,170,255,.35), rgba(90,140,255,.18));
          border: 1px solid rgba(120,170,255,.45); box-shadow: 0 12px 36px rgba(90,140,255,.28); font-weight: 700; color:#fff; }
      `}</style>
    </main>
  );
}
