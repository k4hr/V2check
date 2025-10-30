/* path: app/pay/return/page.tsx */
'use client';

import React, { useEffect, useState } from 'react';

export default function PayReturnPage() {
  const [status, setStatus] = useState<'pending'|'succeeded'|'canceled'|'unknown'>('pending');
  const [msg, setMsg] = useState<string>('');

  useEffect(() => {
    const u = new URL(window.location.href);
    const paymentId = u.searchParams.get('paymentId') || sessionStorage.getItem('lm_last_payment_id') || '';
    if (!paymentId) { setStatus('unknown'); setMsg('Нет идентификатора платежа'); return; }

    let alive = true;
    async function tick() {
      try {
        const r = await fetch(`/api/pay/card/status?id=${encodeURIComponent(paymentId)}`);
        const j = await r.json();
        if (!alive) return;
        if (j.ok && j.status === 'succeeded') {
          setStatus('succeeded');
          setMsg('Оплата подтверждена. Обновляем статус…');
          setTimeout(() => { window.location.href = '/cabinet'; }, 600);
          return;
        }
        if (j.ok && (j.status === 'canceled' || j.status === 'canceled_by_yoo')) {
          setStatus('canceled'); setMsg('Платёж отменён.');
          return;
        }
        // иначе ждём вебхук и пробуем ещё
        setTimeout(tick, 1500);
      } catch {
        setTimeout(tick, 2000);
      }
    }
    tick();
    return () => { alive = false; };
  }, []);

  return (
    <main>
      <div className="safe">
        <h1 className="title">Возврат с платёжной страницы</h1>
        <p className="info">{msg || 'Проверяем статус оплаты…'}</p>
      </div>
      <style jsx>{`
        .safe{max-width:600px;margin:0 auto;padding:20px}
        .title{text-align:center}
        .info{text-align:center;opacity:.8}
      `}</style>
    </main>
  );
}
