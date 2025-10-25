/* path: app/pro/vk/max/page.tsx */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Plan } from '@/lib/pricing';
import { getVkRubKopecks } from '@/lib/pricing';
import { readLocale, STRINGS, type Locale } from '@/lib/i18n';

// Локализованные титулы для PRO+
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

export default function ProVkMaxPage() {
  const locale: Locale = readLocale();
  const S = STRINGS[locale];
  const TITLES = locale === 'en' ? TITLES_EN : TITLES_RU;

  // Цены из новой схемы (копейки)
  const PRICES_KOP = useMemo(() => getVkRubKopecks('PROPLUS'), []);
  const fmt = useMemo(
    () => new Intl.NumberFormat(locale === 'en' ? 'en-RU' : 'ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }),
    [locale]
  );

  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const w: any = window;
    try { document.documentElement.lang = locale; } catch {}
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

  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  async function buyVK(plan: Plan) {
    if (busy) return;
    setBusy(plan);
    setMsg(null);
    setInfo(null);

    try {
      const res = await fetch(`/api/vk/create-order?tier=PROPLUS&plan=${plan}${linkSuffix}`, { method: 'POST' });
      const data = await res.json();

      if (!data?.ok) throw new Error(data?.error || 'VK_CREATE_ORDER_FAILED');

      const w: any = window;
      const bridge = w.vkBridge;

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      if (bridge?.send && data.openPayForm) {
        await bridge.send('VKWebAppOpenPayForm', data.openPayForm);
        setInfo(locale === 'en' ? 'Payment window opened in VK.' : 'Окно оплаты открыто во ВКонтакте.');
        return;
      }
      setInfo(locale === 'en'
        ? 'Order created. If payment didn’t open, check VK payments.'
        : 'Заказ создан. Если окно оплаты не появилось — проверьте платежи VK.'
      );
    } catch (e: any) {
      setMsg(String(e?.message || 'Ошибка VK-оплаты'));
    } finally {
      setTimeout(() => setBusy(null), 800);
    }
  }

  const entries = useMemo(() => Object.entries(PRICES_KOP) as [Plan, number][], [PRICES_KOP]);

  const T = {
    back: S.back || 'Назад',
    title: locale === 'en' ? 'LiveManager Pro+ — payment (VK)' : 'LiveManager Pro+ — оплата (VK)',
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

        <div className="list">
          {entries.map(([plan, amountKop]) => {
            const can = !busy || busy === plan;
            const pretty = fmt.format(Math.round(amountKop / 100));
            return (
              <button
                key={plan}
                disabled={!can}
                onClick={() => buyVK(plan)}
                className="row"
                aria-label={`${TITLES[plan]} — ${pretty}`}
              >
                <span className="left">
                  <span className="dot">✨</span>
                  <b className="name">{TITLES[plan]}</b>
                </span>
                <span className="right">
                  <span className="price">{pretty}</span>
                  <span className="chev">›</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .safe { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; padding: 20px; }
        .title { text-align: center; margin: 6px 0 2px; }
        .err { color: #ff4d6d; text-align: center; }
        .info { opacity: .78; text-align: center; }
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
        .right { display:flex; justify-content:flex-end; align-items:center; gap:10px; font-variant-numeric: tabular-nums; }
        .chev { opacity:.6; }
      `}</style>
    </main>
  );
}
