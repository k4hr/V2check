'use client';

import { useEffect, useState } from 'react';
import { PRICES, type Plan } from '@/lib/pricing';

type MeResp = { ok: boolean; user?: { subscriptionUntil?: string | null } };

export default function ProPage() {
  const [busy, setBusy] = useState<Plan | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tg: any = (window as any)?.Telegram?.WebApp;
      tg?.ready?.(); tg?.expand?.();
      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(() => {
        if (document.referrer) history.back(); else window.location.href = '/';
      });
      return () => tg?.BackButton?.hide?.();
    } catch {}
  }, []);

  // --- вспом. утилиты ---
  function isActive(until?: string | null): boolean {
    if (!until) return false;
    const t = new Date(until).getTime();
    return Number.isFinite(t) && t > Date.now();
  }

  async function pollForActivation(timeoutMs = 90000, stepMs = 2000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const r = await fetch('/api/me', { cache: 'no-store' });
        const data: MeResp = await r.json();
        if (data?.ok && isActive(data?.user?.subscriptionUntil)) return true;
      } catch {}
      await new Promise((res) => setTimeout(res, stepMs));
    }
    return false;
  }

  async function openInvoiceSafe(link: string): Promise<'paid' | 'cancelled' | 'failed' | 'pending'> {
    const tg: any = (window as any)?.Telegram?.WebApp;

    // Вариант 1: Promise из openInvoice
    const tryPromise = async () => {
      if (!tg?.openInvoice) throw new Error('no openInvoice');
      // гонка: промис openInvoice vs таймаут
      const res: any = await Promise.race([
        tg.openInvoice(link),
        new Promise<'pending'>((r) => setTimeout(() => r('pending'), 20000)),
      ]);
      if (res === 'paid' || res === 'cancelled' || res === 'failed' || res === 'pending') return res;
      return 'pending';
    };

    // Вариант 2: старый callback-API
    const tryCallback = async () => {
      if (!tg?.openInvoice) throw new Error('no openInvoice');
      return await new Promise<'paid' | 'cancelled' | 'failed' | 'pending'>((resolve) => {
        let done = false;
        try {
          tg.openInvoice(link, (status: any) => {
            if (done) return;
            done = true;
            if (status === 'paid' || status === 'cancelled' || status === 'failed' || status === 'pending') {
              resolve(status as any);
            } else {
              resolve('pending');
            }
          });
          setTimeout(() => { if (!done) resolve('pending'); }, 20000);
        } catch { resolve('pending'); }
      });
    };

    // Вариант 3: openTelegramLink
    const tryOpenLink = async () => {
      if (tg?.openTelegramLink) { try { tg.openTelegramLink(link); } catch {} return 'pending' as const; }
      window.location.href = link; return 'pending' as const;
    };

    // Пробуем: promise → callback → openTelegramLink
    try { return await tryPromise(); } catch {}
    try { return await tryCallback(); } catch {}
    return await tryOpenLink();
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

      // Открываем инвойс
      const status = await openInvoiceSafe(link);
      if (status === 'failed') setMsg('Оплата не удалась. Попробуйте ещё раз.');
      if (status === 'cancelled') setMsg('Оплата отменена.');

      // В любом случае запускаем пуллинг профиля: так мы поймаем успешный вебхук с задержкой
      setMsg('Ожидание подтверждения оплаты… Если окно закрыто — проверьте историю платежей в Telegram.');
      const ok = await pollForActivation(90000, 2000);
      if (ok) {
        setMsg('Оплата прошла! Обновляем профиль…');
        setTimeout(() => (window.location.href = '/cabinet'), 800);
      } else {
        setMsg('Не получили подтверждение. Если списание прошло — откройте «Кабинет», потяните вниз для обновления.');
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
            <b>Статус оплаты</b><br />
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
