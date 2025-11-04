/* path: app/pro/vk/min/page.tsx */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan } from '@/lib/pricing';
import { getVkRubKopecks } from '@/lib/pricing';
import { readLocale, STRINGS, type Locale } from '@/lib/i18n';

/* ---- локализованные титулы ---- */
const TITLES_RU: Record<Plan, string> = {
  WEEK: 'Pro — Неделя',
  MONTH: 'Pro — Месяц',
  HALF_YEAR: 'Pro — Полгода',
  YEAR: 'Pro — Год',
};
const TITLES_EN: Record<Plan, string> = {
  WEEK: 'Pro — Week',
  MONTH: 'Pro — Month',
  HALF_YEAR: 'Pro — 6 months',
  YEAR: 'Pro — Year',
};

/* ---- форматирование/скидки (как в /pro/min) ---- */
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

/* ---- auth helpers (совместимы с VK) ---- */
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
    const key = j?.user?.telegramId; // сервер возвращает «telegramId» как универсальный ключ
    return key ? String(key) : '';
  } catch { return ''; }
}
async function getAuthKey(): Promise<string> {
  const vkKey = getVkKeyFromCookie();
  if (vkKey) return vkKey;
  return await fetchAuthKeyFromApi();
}
/* ------------------------------------------ */

export default function ProVkMinPage() {
  const locale: Locale = readLocale();
  const S = STRINGS[locale];
  const TITLES = locale === 'en' ? TITLES_EN : TITLES_RU;

  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const pricesRubK = useMemo(() => getVkRubKopecks('PRO'), []);
  const pricesRubDiscounted = useMemo(() => ({
    WEEK:      discountRubForPlan('WEEK',      pricesRubK.WEEK),
    MONTH:     discountRubForPlan('MONTH',     pricesRubK.MONTH),
    HALF_YEAR: discountRubForPlan('HALF_YEAR', pricesRubK.HALF_YEAR),
    YEAR:      discountRubForPlan('YEAR',      pricesRubK.YEAR),
  }), [pricesRubK]);

  useEffect(() => {
    const w: any = window;
    try { document.documentElement.lang = locale; } catch {}
    // инициализация VK Mini Apps
    try {
      if (w.vkBridge?.send) {
        w.vkBridge.send('VKWebAppInit').catch(() => {});
        w.vkBridge.send('VKWebAppExpand').catch(() => {});
      } else if (typeof w.VKWebAppInit === 'function') {
        w.VKWebAppInit();
        try { w.VKWebAppExpand?.(); } catch {}
      }
    } catch {}
  }, [locale]);

  // Прокидываем debug id из query (совместимость с DEBUG)
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  async function buyCardVK(plan: Plan, extraBody: Record<string, any> = {}) {
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
        setMsg('Не удалось определить ваш ID. Откройте приложение из VK и попробуйте снова.');
        return;
      }

      // создаём заказ в VK (редирект или VKWebAppOpenPayForm)
      const res = await fetch(`/api/vk/create-order?tier=PRO&plan=${plan}${linkSuffix}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, telegramId, ...extraBody }),
      });
      const data = await res.json().catch(()=> ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'VK_CREATE_ORDER_FAILED');

      const w: any = window;
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      if (w?.vkBridge?.send && data.openPayForm) {
        await w.vkBridge.send('VKWebAppOpenPayForm', data.openPayForm);
        setInfo(locale === 'en' ? 'Payment window opened in VK.' : 'Окно оплаты открыто во ВКонтакте.');
        return;
      }
      setInfo(locale === 'en'
        ? 'Order created. If payment didn’t open, check VK payments.'
        : 'Заказ создан. Если окно оплаты не появилось — проверьте платежи VK.'
      );
    } catch (e: any) {
      setMsg(String(e?.message || 'Ошибка при подготовке оплаты.'));
    } finally {
      setTimeout(() => setBusy(null), 900);
    }
  }

  // «Пробный день» (1 ₽ → затем месяц)
  async function buyTrial() {
    await buyCardVK('MONTH', { trial: true });
  }

  const T = {
    back: S.back || 'Назад',
    title: locale === 'en' ? 'LiveManager Pro — payment (VK)' : 'LiveManager Pro — оплата (VK)',
    cardHeader: locale === 'en' ? 'Pay by card (RUB)' : 'Оплата картой (₽)',
    cardNote: locale === 'en' ? 'Secure payment via VK Pay' : 'Безопасная оплата через VK Pay',
    sale: (p: Plan) => ({ MONTH: '-30%', HALF_YEAR: '-50%', YEAR: '-70%', WEEK: '' }[p] || ''),
    trialName: locale === 'en' ? 'Pro — Trial day' : 'Pro — Пробный день',
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

        {/* Только оплата картой — как в телеграм-версии */}
        <h3 className="section">{T.cardHeader}</h3>
        <div className="card-grid">
          {/* ПРОБНЫЙ ДЕНЬ — перед месячным тарифом (без бейджика 1 ₽) */}
          <button
            type="button"
            className="card-row"
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
            return (
              <button
                key={p}
                type="button"
                className="card-row"
                disabled={!can}
                onClick={() => buyCardVK(p)}
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
      </div>

      <style jsx>{`
        .safe { max-width: 600px; margin: 0 auto; display:flex; flex-direction:column; gap:14px; padding:20px; }
        .title { text-align:center; margin:6px 0 2px; }
        .section { margin:6px 2px 2px; opacity:.9; }
        .err { color:#ff4d6d; text-align:center; }
        .info { opacity:.78; text-align:center; }
        .back {
          width: 120px; padding: 10px 14px; border-radius: 12px;
          background:#171a21; border:1px solid var(--border);
          display:flex; align-items:center; gap:8px;
        }

        /* Card block (копия из TG версии) */
        .card-grid { display:grid; gap:10px; }
        .card-row {
          position:relative; width:100%; border:1px solid rgba(120,170,255,.25); border-radius:14px; padding:14px 16px;
          display:grid; grid-template-columns:1fr auto auto auto; grid-template-areas:"left sale price chev"; align-items:center; column-gap:12px;
          background: radial-gradient(120% 140% at 10% 0%, rgba(76,130,255,.12), rgba(255,255,255,.03));
          box-shadow: 0 10px 35px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04);
        }
        .card-left { grid-area:left; display:flex; align-items:center; gap:10px; min-width:0; }
        .bank { width:30px; height:30px; border-radius:10px; display:grid; place-items:center; background: rgba(120,170,255,.16); border:1px solid rgba(120,170,255,.22); }
        .sale { grid-area:sale; padding:4px 8px; border-radius:10px; font-size:12px; background:rgba(76,130,255,.18); border:1px solid rgba(120,170,255,.35); white-space:nowrap; }
        .sale--empty { visibility:hidden; padding:0; border:0; }
        .price-wrap { grid-area:price; display:flex; flex-direction:column; align-items:flex-end; line-height:1.05; }
        .price-new { font-weight:800; }
        .price-old { opacity:.55; text-decoration:line-through; font-size:13px; }
        .subnote { opacity:.7; margin-top:-4px; }
        .chev { opacity:.6; }

        @media (max-width:380px){
          .card-row { grid-template-columns:1fr auto; grid-template-areas:"left chev" "sale chev" "price chev"; row-gap:6px; }
          .price-wrap { align-items:flex-start; }
        }
      `}</style>
    </main>
  );
}
