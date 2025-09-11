'use client';

import { useEffect, useState } from 'react';
import { PRICES, type Plan } from '@/lib/pricing';

export default function ProPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const w: any = window;
      const tg = w?.Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(() => {
        if (document.referrer) history.back();
        else window.location.href = '/';
      });
      return () => tg?.BackButton?.hide?.();
    } catch {}
  }, []);

  async function openInvoiceSafe(link: string): Promise<'paid' | 'cancelled' | 'failed' | 'pending'> {
    const w: any = window;
    const tg = w?.Telegram?.WebApp;

    // 1) Нормальный путь — Promise из openInvoice (SDK v7)
    if (tg?.openInvoice && typeof tg.openInvoice === 'function') {
      try {
        const status: any = await Promise.race([
          tg.openInvoice(link),
          // 2) Фолбэк по таймауту, чтобы не висело
          new Promise<'pending'>((resolve) => setTimeout(() => resolve('pending'), 20000)),
        ]);
        if (status === 'paid' || status === 'cancelled' || status === 'failed' || status === 'pending') {
          return status;
        }
        // некоторые клиенты могут не вернуть строку — считаем как "pending"
        return 'pending';
      } catch {
        // поймаем редкие ошибки openInvoice
      }
    }

    // 3) Резервный путь — открыть ссылку в Telegram
    if (tg?.openTelegramLink) {
      try {
        tg.openTelegramLink(link);
        return 'pending';
      } catch {}
    }

    // 4) Самый последний шанс — обычный переход
    window.location.href = link;
    return 'pending';
  }

  async function buy(plan: Plan) {
    if (busy) return;
    setBusy(plan);
    setMsg(null);
    try {
      const res = await fetch(`/api/createInvoice?plan=${encodeURIComponent(plan)}`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!data?.ok || !data?.link) {
        throw new Error(data?.error || data?.detail?.description || 'Ошибка создания счёта');
      }
      const link = String(data.link);

      const status = await openInvoiceSafe(link);

      if (status === 'paid') {
        // После оплаты можно вернуть на кабинет/обновить данные
        setMsg('Оплата прошла! Обновляем профиль…');
        setTimeout(() => (window.location.href = '/cabinet'), 800);
      } else if (status === 'cancelled') {
        setMsg('Оплата отменена.');
      } else if (status === 'failed') {
        setMsg('Оплата не удалась. Попробуйте ещё раз.');
      } else {
        // pending — клиент не прислал финальный статус
        setMsg('Ожидание подтверждения оплаты… Если окно закрыто — проверьте историю платежей в Telegram.');
      }
    } catch (e: any) {
      setMsg(e?.message || 'Неизвестная ошибка');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main>
      <div className="safe" style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: 'calc(100dvh - 32px)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-serif, inherit)', fontWeight: 700, fontSize: 28, marginBottom: 8 }}>
            Juristum Pro
          </h1>
          <p style={{ opacity: 0.85, marginBottom: 20 }}>Выберите тариф:</p>
        </div>

        {msg && (
          <div className="card" role="alert" style={{ marginBottom: 12, borderColor: 'rgba(255,180,0,.35)' }}>
            <b>Статус оплаты</b>
            <br />
            <span style={{ opacity: 0.85 }}>{msg}</span>
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          {(['WEEK', 'MONTH', 'HALF', 'YEAR'] as Plan[]).map((p) => {
            const cfg = PRICES[p];
            let badge: JSX.Element | null = null;
            if (p === 'MONTH') {
              badge = <span className="badge badge--pop">Самый популярный</span>;
            } else if (p === 'HALF') {
              const base = PRICES.MONTH.amount * 6;
              const save = Math.max(0, Math.round((1 - cfg.amount / base) * 100));
              badge = <span className="badge badge--save">Экономия {save}%</span>;
            } else if (p === 'YEAR') {
              const base = PRICES.MONTH.amount * 12;
              const save = Math.max(0, Math.round((1 - cfg.amount / base) * 100));
              badge = <span className="badge badge--save">Экономия {save}%</span>;
            }
            return (
              <button
                key={p}
                type="button"
                onClick={() => buy(p)}
                className="list-btn"
                disabled={!!busy}
                aria-label={`Купить: ${cfg.label}`}
              >
                <span className="list-btn__left" style={{ gap: 12 }}>
                  <span className="list-btn__emoji">⭐</span>
                  <b>{cfg.label}</b>
                  {badge && <span style={{ marginLeft: 6 }}>{badge}</span>}
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
          <p className="text-xs opacity-60" style={{ fontSize: 12, opacity: 0.55, textAlign: 'center', marginTop: 24 }}>
            Подтверждая, вы соглашаетесь с <a href="/terms" style={{ textDecoration: 'underline' }}>условиями подписки</a>.
          </p>
          <p className="text-xs opacity-60" style={{ fontSize: 12, opacity: 0.55, textAlign: 'center' }}>
            Также ознакомьтесь с <a href="/legal" style={{ textDecoration: 'underline' }}>правовой информацией</a>.
          </p>
        </div>
      </div>
    </main>
  );
}
