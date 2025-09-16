// app/pro/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import type { Plan } from '@/lib/pricing';
import { PRICES } from '@/lib/pricing';

export default function ProPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      const w: any = window;
      const tg = w?.Telegram?.WebApp;
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
      const res = await fetch(`/api/createInvoice?plan=${encodeURIComponent(plan)}`, { method: 'POST' });
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

  // --- УНИКАЛИЗАЦИЯ ПЛАНОВ (убираем дубликаты) ---
  const uniquePlans = React.useMemo(() => {
    // Преобразуем объект PRICES -> массив с ключом и конфигом
    const entries = Object.entries(PRICES).map(([key, cfg]) => ({ key: key as Plan, cfg }));
    // Уберём дубли по (title + days)
    const map = new Map<string, { key: Plan; cfg: typeof PRICES[Plan] }>();
    for (const it of entries) {
      const sig = `${it.cfg.title}::${it.cfg.days}`;
      if (!map.has(sig)) map.set(sig, it);
    }
    // Сортируем по длительности (дни)
    return Array.from(map.values()).sort((a, b) => a.cfg.days - b.cfg.days);
  }, []);

  return (
    <main>
      <div className="safe" style={{
        maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column',
        gap: 12, padding: 20
      }}>
        <h1 style={{ textAlign: 'center' }}>Подписка Juristum Pro</h1>
        {msg && <p style={{ color: 'crimson', textAlign: 'center' }}>{msg}</p>}
        {info && <p style={{ opacity: .7, textAlign: 'center' }}>{info}</p>}

        <div style={{ display: 'grid', gap: 12 }}>
          {uniquePlans.map(({ key, cfg }) => {
            const plan = key as Plan;
            const can = !busy || busy === plan;
            return (
              <button
                key={`${cfg.title}-${cfg.days}`}
                disabled={!can}
                className="list-btn"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid #333', borderRadius: 12, padding: '12px 16px',
                  opacity: can ? 1 : .6
                }}
                onClick={() => buy(plan)}
              >
                <span className="list-btn__left">
                  <span className="list-btn__emoji">⭐</span>
                  <b>{cfg.title}</b>
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
          <p className="text-xs opacity-60" style={{ fontSize: 12, opacity: .55, textAlign: 'center', marginTop: 24 }}>
            Подтверждая, вы соглашаетесь с <a href="/terms" style={{ textDecoration: 'underline' }}>условиями подписки</a>.
          </p>
          <p className="text-xs opacity-60" style={{ fontSize: 12, opacity: .55, textAlign: 'center' }}>
            Также ознакомьтесь с <a href="/legal" style={{ textDecoration: 'underline' }}>правовой информацией</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
