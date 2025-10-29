/* path: app/tpay/fail/page.tsx */
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

export default function TpayFailPage() {
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

  // лёгкая инициализация контейнера + хаптик «ошибка»
  useEffect(() => {
    const w: any = window;
    try {
      if (platform === 'telegram') {
        w?.Telegram?.WebApp?.ready?.();
        w?.Telegram?.WebApp?.expand?.();
        try { w?.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error'); } catch {}
      } else if (platform === 'vk') {
        const b = (w as any).vkBridge;
        if (b?.send) { b.send('VKWebAppInit').catch(() => {}); }
      }
    } catch {}
  }, [platform]);

  // Параметры, которые может прислать банк
  const info = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = u.searchParams;
      return {
        orderId: sp.get('OrderId') || sp.get('orderId') || '',
        paymentId: sp.get('PaymentId') || sp.get('paymentId') || '',
        errorCode: sp.get('ErrorCode') || sp.get('errorCode') || sp.get('code') || '',
        errorMessage:
          sp.get('ErrorMessage') ||
          sp.get('errorMessage') ||
          sp.get('message') ||
          sp.get('reason') ||
          '',
      };
    } catch {
      return { orderId: '', paymentId: '', errorCode: '', errorMessage: '' };
    }
  }, []);

  return (
    <main className="wrap">
      <div className="card">
        <div className="icon err" aria-hidden>❌</div>
        <h1 className="title">Оплата не прошла</h1>
        <p className="sub">
          Платёж отклонён или прерван. Попробуйте ещё раз — иногда это временная ошибка
          банка или ограничения по карте.
        </p>

        {(info.orderId || info.paymentId || info.errorCode || info.errorMessage) && (
          <p className="meta">
            {info.orderId ? <>Заказ: <b>{info.orderId}</b><br/></> : null}
            {info.paymentId ? <>Платёж: <b>{info.paymentId}</b><br/></> : null}
            {info.errorCode ? <>Код ошибки: <b>{info.errorCode}</b><br/></> : null}
            {info.errorMessage ? <>Описание: <b>{info.errorMessage}</b></> : null}
          </p>
        )}

        <div className="grid">
          <Link href={`/pro${linkSuffix}` as Route} className="btn btn--primary">Повторить оплату</Link>
          <Link href={`/home${linkSuffix}` as Route} className="btn">На главную</Link>
        </div>

        <details className="tips">
          <summary>Что можно попробовать</summary>
          <ul>
            <li>Проверить лимиты и доступность интернет-платежей по карте.</li>
            <li>Выбрать другой способ оплаты или другую карту.</li>
            <li>Подождать пару минут и повторить попытку.</li>
          </ul>
        </details>
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
        .sub { opacity: .9; margin: 0; }
        .meta { opacity: .65; font-size: 13px; margin: 10px 0 0; text-align: left; }
        .grid { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; margin-top: 16px; }
        .btn {
          display: inline-grid; place-items: center; text-decoration: none; padding: 12px;
          border-radius: 12px; border: 1px solid rgba(255,255,255,.12); color: #fff; background: #171f33;
        }
        .btn--primary {
          background: linear-gradient(135deg,#ff6b6b,#ff3b3b 48%,#b845ff);
          border-color: rgba(255,110,110,.85);
        }
        .tips {
          text-align: left;
          margin-top: 12px;
          background: #0f1422;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 12px;
          padding: 10px 12px;
          opacity: .95;
        }
        .tips summary { cursor: pointer; font-weight: 700; }
        .tips ul { margin: 8px 0 0 18px; opacity: .9; }
        @media (max-width: 420px){ .grid{ grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
