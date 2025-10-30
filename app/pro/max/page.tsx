/* path: app/pro/max/page.tsx */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan, Tier } from '@/lib/pricing';
import { getPrices, getVkRubKopecks } from '@/lib/pricing';
import { readLocale, STRINGS, type Locale } from '@/lib/i18n';

const tier: Tier = 'PROPLUS';

const TITLES_RU: Record<Plan, string> = {
  WEEK: 'Pro+ — Неделя',
  MONTH: 'Pro+ — Месяц',
  HALF_YEAR: 'Pro+ — Полгода',
  YEAR: 'Pro+ — Год',
};
const TITLES_EN: Record<Plan, string> = {
  WEEK: 'Pro+ — Week',
  MONTH: 'Pro+ — Month',
  HALF_YEAR: 'Pro+ — 6 months',
  YEAR: 'Pro+ — Year',
};

function Star({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path d="M12 2.75l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.98l-5.8 3.06 1.11-6.47-4.7-4.58 6.49-.94L12 2.75z" fill="currentColor" />
    </svg>
  );
}

function formatRUB(kopecks: number, locale: 'ru' | 'en'): string {
  const rub = Math.floor(kopecks / 100);
  const fmt = new Intl.NumberFormat(locale === 'en' ? 'en-RU' : 'ru-RU');
  return fmt.format(rub) + ' ₽';
}

export default function ProMaxPage() {
  const locale: Locale = readLocale();
  const S = STRINGS[locale];
  const TITLES = locale === 'en' ? TITLES_EN : TITLES_RU;

  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // цены
  const pricesStars = useMemo(() => getPrices(tier), []);
  const pricesRub   = useMemo(() => getVkRubKopecks(tier), []);

  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    try {
      tg?.BackButton?.show?.();
      const back = () => { if (document.referrer) history.back(); else window.location.href = '/pro'; };
      tg?.BackButton?.onClick?.(back);
      return () => { tg?.BackButton?.hide?.(); tg?.BackButton?.offClick?.(back); };
    } catch {}
    try { document.documentElement.lang = locale; } catch {}
  }, [locale]);

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

  async function buyCard(plan: Plan) {
    if (busy) return;
    setBusy(plan); setMsg(null); setInfo(null);
    try {
      // сервер должен вернуть ссылку ЮKassa/шлюза
      const res = await fetch(`/api/pay/card/create?tier=${tier}&plan=${plan}`, { method: 'POST' });
      const { ok, url, error, message } = await res.json();
      if (!ok || !url) throw new Error(error || message || 'CARD_LINK_FAILED');

      const tg: any = (window as any).Telegram?.WebApp;
      if (tg?.openLink) tg.openLink(url, { try_instant_view: false });
      else window.location.href = url;
    } catch (e: any) {
      setMsg(String(e?.message || 'Ошибка при подготовке оплаты картой.'));
    } finally {
      setTimeout(() => setBusy(null), 800);
    }
  }

  const entries = Object.entries(pricesStars) as [Plan, typeof pricesStars[Plan]][];

  const T = {
    back: S.back || 'Назад',
    title: locale === 'en' ? 'LiveManager Pro+ — payment' : 'LiveManager Pro+ — оплата',
    starsHeader: locale === 'en' ? 'Pay in Telegram Stars' : 'Оплата в Telegram Stars',
    cardHeader: locale === 'en' ? 'Pay by card (RUB)' : 'Оплата картой (₽)',
    cardNote: locale === 'en'
      ? 'Secure payment via YooKassa'
      : 'Безопасная оплата через ЮKassa',
  };

  return (
    <main>
      <div className="safe">
        <button
          type="button"
          onClick={() => (document.referrer ? history.back() : (window.location.href = '/pro'))}
          className="back"
        >
          <span>←</span><b>{T.back}</b>
        </button>

        <h1 className="title">{T.title}</h1>
        {msg && <p className="err">{msg}</p>}
        {info && <p className="info">{info}</p>}

        {/* Stars */}
        <h3 className="section">{T.starsHeader}</h3>
        <div className="list">
          {entries.map(([key, cfg]) => {
            const can = !busy || busy === key;
            return (
              <button
                key={key}
                disabled={!can}
                onClick={() => buyStars(key)}
                className="row"
                aria-label={`${TITLES[key]} — ${cfg.amount} ⭐`}
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

        {/* Card / RUB */}
        <h3 className="section">{T.cardHeader}</h3>
        <div className="card-grid">
          {(Object.keys(pricesRub) as Plan[]).map((p) => (
            <button
              key={p}
              type="button"
              className="card-row"
              disabled={!!busy && busy !== p}
              onClick={() => buyCard(p)}
            >
              <div className="card-left">
                <span className="bank">💳</span>
                <b className="name">{TITLES[p]}</b>
              </div>
              <div className="card-right">
                <span className="price">{formatRUB(pricesRub[p], locale)}</span>
                <span className="chev">›</span>
              </div>
            </button>
          ))}
        </div>
        <small className="subnote">{T.cardNote}</small>
      </div>

      <style jsx>{`
        .safe { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; padding: 20px; }
        .title { text-align: center; margin: 6px 0 2px; }
        .section { margin: 6px 2px 2px; opacity: .9; }
        .err { color: #ff4d6d; text-align: center; }
        .info { opacity: .7; text-align: center; }
        .back {
          width: 120px; padding: 10px 14px; border-radius: 12px;
          background:#171a21; border:1px solid var(--border);
          display:flex; align-items:center; gap:8px;
        }

        /* Stars list */
        .list { display: grid; gap: 12px; }
        .row {
          width: 100%; border: 1px solid #333; border-radius: 14px;
          padding: 14px 18px; display: grid; grid-template-columns: 1fr auto;
          align-items: center; column-gap: 12px; background: #121621;
        }
        .left { display:flex; align-items:center; gap:10px; min-width:0; }
        .dot { font-size: 18px; }
        .name { white-space: nowrap; }
        .right { display:flex; justify-content:flex-end; align-items:center; gap:8px; font-variant-numeric: tabular-nums; }
        .star :global(svg){ display:block; }
        .chev { opacity:.6; }

        /* Card block */
        .card-grid { display: grid; gap: 10px; }
        .card-row {
          width: 100%; border: 1px solid rgba(120,170,255,.25); border-radius: 14px;
          padding: 14px 16px; display: grid; grid-template-columns: 1fr auto;
          align-items: center; column-gap: 12px;
          background: radial-gradient(120% 140% at 10% 0%, rgba(76,130,255,.12), rgba(255,255,255,.03));
          box-shadow: 0 10px 35px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04);
        }
        .card-left { display:flex; align-items:center; gap:10px; min-width:0; }
        .bank {
          width:30px; height:30px; border-radius:10px; display:grid; place-items:center;
          background: rgba(120,170,255,.16); border: 1px solid rgba(120,170,255,.22);
        }
        .card-right { display:flex; justify-content:flex-end; align-items:center; gap:8px; font-variant-numeric: tabular-nums; }
        .price { white-space: nowrap; }
        .subnote { opacity:.7; margin-top: -4px; }

        button:disabled { opacity:.6; }
      `}</style>
    </main>
  );
}
