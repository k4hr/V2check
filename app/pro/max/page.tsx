// app/pro/max/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan, Tier } from '@/lib/pricing';
import { getPrices, getVkRubKopecks } from '@/lib/pricing';
import { readLocale, STRINGS, type Locale } from '@/lib/i18n';
import BackBtn from '@/app/components/BackBtn';

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

/* скидки только для оплаты картой */
function formatRUB(kopecks: number, locale: 'ru' | 'en'): string {
  const rub = Math.floor(kopecks / 100);
  const fmt = new Intl.NumberFormat(locale === 'en' ? 'en-RU' : 'ru-RU');
  return fmt.format(rub) + ' ₽';
}
const CARD_DISCOUNT: Partial<Record<Plan, number>> = {
  MONTH: 0.30,
  HALF_YEAR: 0.50,
  YEAR: 0.70,
};
function roundDownToNine(rub: number): number {
  if (rub <= 9) return 9;
  return Math.floor((rub - 9) / 10) * 10 + 9;
}
function discountRubForPlan(plan: Plan, kopecks: number): number {
  const rub = Math.floor(kopecks / 100);
  const d = CARD_DISCOUNT[plan] ?? 0;
  if (!d) return rub;
  const discounted = Math.max(1, Math.floor(rub * (1 - d)));
  return roundDownToNine(discounted);
}

/* ---- auth helpers (как в Pro) ---- */
function getCookie(name: string): string {
  try {
    const rows = document.cookie ? document.cookie.split('; ') : [];
    for (const row of rows) {
      const [k, ...rest] = row.split('=');
      if (decodeURIComponent(k) === name) return decodeURIComponent(rest.join('='));
    }
  } catch {}
  return '';
}
function getTgIdFromWebApp(): string {
  try {
    const tg: any = (window as any)?.Telegram?.WebApp;
    const id = tg?.initDataUnsafe?.user?.id;
    return id ? String(id) : '';
  } catch { return ''; }
}
function getVkKeyFromCookie(): string {
  try {
    const raw = getCookie('vk_params');
    if (!raw) return '';
    const sp = new URLSearchParams(raw);
    const uid = sp.get('vk_user_id');
    return uid ? `vk:${uid}` : '';
  } catch { return ''; }
}
async function fetchAuthKeyFromApi(): Promise<string> {
  try {
    const r = await fetch('/api/me', { method: 'POST', cache: 'no-store' });
    const j = await r.json().catch(()=> ({}));
    const key = j?.user?.telegramId;
    return key ? String(key) : '';
  } catch { return ''; }
}
async function getAuthKey(): Promise<string> {
  const tgId = getTgIdFromWebApp();
  if (tgId) return tgId;
  const vkKey = getVkKeyFromCookie();
  if (vkKey) return vkKey;
  return await fetchAuthKeyFromApi();
}
/* ---------------------------------- */

export default function ProMaxPage() {
  const locale: Locale = readLocale();
  const S = STRINGS[locale];
  const TITLES = locale === 'en' ? TITLES_EN : TITLES_RU;

  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pricesStars = useMemo(() => getPrices(tier), []);
  const pricesRubK  = useMemo(() => getVkRubKopecks(tier), []);
  const pricesRubDiscounted = useMemo(() => ({
    WEEK:      discountRubForPlan('WEEK',      pricesRubK.WEEK),
    MONTH:     discountRubForPlan('MONTH',     pricesRubK.MONTH),
    HALF_YEAR: discountRubForPlan('HALF_YEAR', pricesRubK.HALF_YEAR),
    YEAR:      discountRubForPlan('YEAR',      pricesRubK.YEAR),
  }), [pricesRubK]);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
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

  async function buyCard(plan: Plan, extraBody: Record<string, any> = {}) {
    if (busy) return;
    setBusy(plan); setMsg(null); setInfo(null);
    try {
      const email = (typeof localStorage !== 'undefined' ? localStorage.getItem('lm_email') : '') || '';
      if (!/\S+@\S+\.\S+/.test(email)) {
        setMsg('Укажите e-mail для чека');
        const ret = encodeURIComponent(location.pathname);
        window.location.href = `/pay/email?return=${ret}`;
        return;
      }

      const telegramId = await getAuthKey();
      if (!telegramId) {
        setMsg('Не удалось определить ваш ID. Откройте приложение из Telegram/VK и попробуйте снова.');
        return;
      }

      const res = await fetch(`/api/pay/card/create?tier=${tier}&plan=${plan}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, telegramId, ...extraBody }),
      });
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

  async function buyTrial() {
    await buyCard('MONTH', { trial: true });
  }

  const entries = Object.entries(pricesStars) as [Plan, typeof pricesStars[Plan]][];

  const T = {
    title: locale === 'en' ? 'LiveManager Pro+ — payment' : 'LiveManager Pro+ — оплата',
    starsHeader: locale === 'en' ? 'Pay in Telegram Stars' : 'Оплата в Telegram Stars',
    cardHeader: locale === 'en' ? 'Pay by card (RUB)' : 'Оплата картой (₽)',
    cardNote: locale === 'en' ? 'Secure payment via YooKassa' : 'Безопасная оплата через ЮKassa',
    sale: (p: Plan) => ({ MONTH: '-30%', HALF_YEAR: '-50%', YEAR: '-70%', WEEK: '' }[p] || ''),
    trialName: locale === 'en' ? 'Pro+ — Trial day' : 'Pro+ — Пробный день',
  };

  return (
    <main>
      <div className="safe">
        <BackBtn fallback="/pro" />

        <h1 className="title">{T.title}</h1>
        {msg && <p className="err">{msg}</p>}
        {info && <p className="info">{info}</p>}

        {/* Card / RUB — СВЕРХУ */}
        <h3 className="section">{T.cardHeader}</h3>
        <div className="card-grid">
          {/* ПРОБНЫЙ ДЕНЬ — красный */}
          <button
            type="button"
            className="card-row card-row--trial glass"
            disabled={!!busy && busy !== 'MONTH'}
            onClick={buyTrial}
          >
            <div className="card-left">
              <span className="bank">💳</span>
              <b className="name">{T.trialName}</b>
            </div>
            <span className="sale sale--empty" aria-hidden />
            <div className="price-wrap">
              <span className="price-new">{formatRUB(100, locale)}</span>
              <del className="price-old">{formatRUB(1000, locale)}</del>
            </div>
            <span className="chev">›</span>
          </button>

          {(Object.keys(pricesRubK) as Plan[]).map((p) => {
            const oldRub = Math.floor(pricesRubK[p] / 100);
            const newRub = pricesRubDiscounted[p];
            const hasSale = !!CARD_DISCOUNT[p];
            const can = !busy || busy === p;
            const gold = p === 'MONTH';
            return (
              <button
                key={p}
                type="button"
                className={`card-row glass ${gold ? 'card-row--gold' : ''}`}
                disabled={!can}
                onClick={() => buyCard(p)}
              >
                <div className="card-left">
                  <span className="bank">💳</span>
                  <b className="name">{TITLES[p]}</b>
                </div>
                {hasSale ? <span className="sale">{T.sale(p)}</span> : <span className="sale sale--empty" aria-hidden />}
                <div className="price-wrap">
                  {hasSale ? (
                    <>
                      <span className="price-new">{formatRUB(newRub * 100, locale)}</span>
                      <del className="price-old">{formatRUB(oldRub * 100, locale)}</del>
                    </>
                  ) : (
                    <span className="price-new">{formatRUB(oldRub * 100, locale)}</span>
                  )}
                </div>
                <span className="chev">›</span>
              </button>
            );
          })}
        </div>
        <small className="subnote">{T.cardNote}</small>

        {/* Stars — белые стеклянные */}
        <h3 className="section">{T.starsHeader}</h3>
        <div className="list">
          {entries.map(([key, cfg]) => {
            const can = !busy || busy === key;
            return (
              <button
                key={key}
                disabled={!can}
                onClick={() => buyStars(key)}
                className="row glass"
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
      </div>

      <style jsx>{`
        .safe { max-width: 600px; margin: 0 auto; display:flex; flex-direction:column; gap:14px; padding:20px; }
        .title { text-align:center; margin:6px 0 2px; }
        .section { margin:6px 2px 2px; opacity:.9; }
        .err { color:#ff4d6d; text-align:center; }
        .info { opacity:.7; text-align:center; }

        .glass {
          background: rgba(255,255,255,.78);
          color: #0d1220;
          border: 1px solid rgba(0,0,0,.08);
          box-shadow:
            0 10px 28px rgba(17, 23, 40, .12),
            inset 0 0 0 1px rgba(255,255,255,.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }

        .list { display:grid; gap:12px; }
        .row {
          width:100%; border-radius:14px; padding:14px 18px;
          display:grid; grid-template-columns:1fr auto; align-items:center; column-gap:12px;
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        }
        .row:hover { transform: translateY(-1px); }
        .left { display:flex; align-items:center; gap:10px; min-width:0; }
        .right { display:flex; justify-content:flex-end; align-items:center; gap:8px; font-variant-numeric: tabular-nums; }
        .star :global(svg){ display:block; }
        .chev { opacity:.45; }

        .card-grid { display:grid; gap:10px; }
        .card-row {
          position:relative; width:100%; border-radius:14px; padding:14px 16px;
          display:grid; grid-template-columns:1fr auto auto auto; grid-template-areas:"left sale price chev";
          align-items:center; column-gap:12px;
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        }
        .card-row:hover { transform: translateY(-1px); }
        .card-left { grid-area:left; display:flex; align-items:center; gap:10px; min-width:0; }
        .bank { width:30px; height:30px; border-radius:10px; display:grid; place-items:center;
          background: rgba(0,0,0,.04); border:1px solid rgba(0,0,0,.08); }
        .sale { grid-area:sale; padding:4px 8px; border-radius:10px; font-size:12px;
          background: rgba(91,140,255,.18); border:1px solid rgba(91,140,255,.38); white-space:nowrap; }
        .sale--empty { visibility:hidden; padding:0; border:0; }
        .price-wrap { grid-area:price; display:flex; flex-direction:column; align-items:flex-end; line-height:1.05; }
        .price-new { font-weight:800; }
        .price-old { opacity:.55; text-decoration:line-through; font-size:13px; }
        .subnote { opacity:.7; margin-top:-4px; }
        button:disabled { opacity:.75; }

        .card-row--gold {
          border-color: rgba(255,191,73,.55);
          box-shadow:
            0 12px 34px rgba(255,191,73,.20),
            inset 0 0 0 1px rgba(255,210,120,.55);
          background:
            linear-gradient(135deg, rgba(255,210,120,.18), rgba(255,191,73,.12)),
            rgba(255,255,255,.78);
        }
        .card-row--trial {
          border-color: rgba(255,99,99,.45);
          box-shadow:
            0 12px 34px rgba(255,99,99,.18),
            inset 0 0 0 1px rgba(255,255,255,.55);
          background:
            linear-gradient(135deg, rgba(255,120,120,.18), rgba(255,90,90,.10)),
            rgba(255,255,255,.78);
        }

        @media (max-width:380px){
          .card-row { grid-template-columns:1fr auto; grid-template-areas:"left chev" "sale chev" "price chev"; row-gap:6px; }
          .price-wrap { align-items:flex-start; }
        }
      `}</style>
    </main>
  );
}
