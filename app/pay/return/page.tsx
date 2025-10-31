/* path: app/pay/return/page.tsx */
'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function PayReturnPage() {
  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    try {
      tg?.BackButton?.show?.();
      const back = () => { if (document.referrer) history.back(); else window.location.href = '/cabinet'; };
      tg?.BackButton?.onClick?.(back);
      return () => { tg?.BackButton?.hide?.(); tg?.BackButton?.offClick?.(back); };
    } catch {}
  }, []);

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: 20, display:'grid', gap:14 }}>
      <h1 style={{ textAlign:'center', marginBottom: 0 }}>Возврат из платёжного окна</h1>
      <p style={{ textAlign:'center', opacity:.85 }}>
        Если оплата прошла успешно, подписка активируется автоматически сразу после подтверждения ЮKassa.
      </p>

      <div style={{
        margin:'0 auto', maxWidth: 560, padding:14, borderRadius:12,
        border:'1px solid rgba(255,255,255,.12)', background:'#121621', display:'grid', gap:10
      }}>
        <Link href="/cabinet" className="list-btn" style={{ textDecoration:'none' }}>
          Перейти в личный кабинет
        </Link>
        <Link href="/home" className="list-btn" style={{ textDecoration:'none', background:'#171a21', border:'1px solid var(--border)' }}>
          На главную
        </Link>
      </div>
    </main>
  );
}
