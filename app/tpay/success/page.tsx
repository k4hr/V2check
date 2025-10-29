/* path: app/tpay/success/page.tsx */
'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo } from 'react';
import { detectPlatform } from '@/lib/platform';

function setWelcomedCookie() {
  try {
    document.cookie = `welcomed=1; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=None; Secure`;
  } catch {}
}

export default function TpaySuccessPage() {
  // фикс «возврат на /page»
  useEffect(setWelcomedCookie, []);

  const platform = useMemo(() => detectPlatform(), []);

  // хвост ссылок: welcomed=1 + пробрасываем id (если был)
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1');
      const id = u.searchParams.get('id');
      if (id) sp.set('id', id);
      const s = sp.toString();
      return s ? `?${s}` : '?welcomed=1';
    } catch {
      return '?welcomed=1';
    }
  }, []);

  // лёгкая инициализация контейнера (на всякий)
  useEffect(() => {
    const w: any = window;
    try {
      if (platform === 'telegram') {
        w?.Telegram?.WebApp?.ready?.();
        w?.Telegram?.WebApp?.expand?.();
        // Подсветим оплату на клиенте
        try { w?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success'); } catch {}
      } else if (platform === 'vk') {
        const b = (w as any).vkBridge;
        if (b?.send) { b.send('VKWebAppInit').catch(() => {}); }
      }
    } catch {}
  }, [platform]);

  // Параметры, которые может прислать банк (для инфо)
  const info = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      return {
        orderId: u.searchParams.get('OrderId') || u.searchParams.get('orderId') || '',
        paymentId: u.searchParams.get('PaymentId') || u.searchParams.get('paymentId') || '',
      };
    } catch { return { orderId: '', paymentId: '' }; }
  }, []);

  return (
    <main className="wrap">
      <div className="card">
        <div className="icon ok" aria-hidden>✅</div>
        <h1 className="title">Оплата прошла</h1>
        <p className="sub">Спасибо! Подписка активируется автоматически в течение минуты.</p>

        {(info.orderId || info.paymentId) && (
          <p className="meta">
            {info.orderId ? <>Заказ: <b>{info.orderId}</b><br/></> : null}
            {info.paymentId ? <>Платёж: <b>{info.paymentId}</b></> : null}
          </p>
        )}

        <div className="grid">
          <Link href={`/cabinet${linkSuffix}` as Route} className="btn btn--primary">В личный кабинет</Link>
          <Link href={`/home${linkSuffix}` as Route} className="btn">На главную</Link>
        </div>
      </div>

      <style jsx>{`
        .wrap { padding: 22px; max-width: 760px; margin: 0 auto; }
        .card {
          border: 1px solid rgba(255,255,255,.08);
          background: #121828;
          border-radius: 16px; padding: 18px; text-align: center;
          box-shadow: 0 10px 28px rgba(0,0,0,.25);
        }
        .icon { font-size: 42px; margin-bottom: 6px; }
        .title { margin: 6px 0 4px; }
        .sub { opacity: .85; margin: 0; }
        .meta { opacity: .6; font-size: 13px; margin: 10px 0 0; }
        .grid { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; margin-top: 16px; }
        .btn {
          display: inline-grid; place-items: center; text-decoration: none; padding: 12px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,.12); color: #fff; background: #171f33;
        }
        .btn--primary { background: linear-gradient(135deg,#5a69ff,#3a7bff 48%,#7a5cff); border-color: rgba(110,134,255,.85); }
        @media (max-width: 420px){ .grid{ grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
