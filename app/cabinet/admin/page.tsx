'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type CheckResp = { ok: boolean; admin?: boolean; id?: string | null; via?: string; error?: string };

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function AdminHome() {
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const [info, setInfo] = useState<string>('');

  // для браузерного режима
  const debugId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? id : '';
    } catch { return ''; }
  }, []);

  async function check() {
    try {
      const headers: Record<string, string> = {};
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      if (initData) headers['x-init-data'] = initData;

      let url = '/api/admin/check';
      if (!initData && DEBUG && debugId) url += `?id=${encodeURIComponent(debugId)}`;

      const r = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      const data: CheckResp = await r.json().catch(() => ({ ok: false }));

      setAllowed(Boolean(data?.admin));
      if (DEBUG) setInfo(`id=${data?.id || 'n/a'} via=${data?.via || 'n/a'} admin=${String(data?.admin)}`);
    } catch {
      setAllowed(false);
      if (DEBUG) setInfo('check error');
    }
  }

  useEffect(() => {
    try { (window as any)?.Telegram?.WebApp?.ready?.(); } catch {}
    check();
  }, [debugId]);

  if (allowed === false) {
    return (
      <main className="safe" style={{ padding: 20 }}>
        <p>Доступ запрещён.</p>
        {DEBUG && <p style={{ opacity: .6, fontSize: 12 }}>{info}</p>}
        <Link href={debugId ? { pathname: '/cabinet', query: { id: debugId } } : '/cabinet'} className="list-btn"
          onClick={() => haptic('light')}
          style={{ display: 'inline-flex', marginTop: 12 }}>
          ← В кабинет
        </Link>
      </main>
    );
  }

  if (allowed === null) {
    return (
      <main className="safe" style={{ padding: 20 }}>
        <p>Проверяем доступ…</p>
        {DEBUG && <p style={{ opacity: .6, fontSize: 12 }}>{info}</p>}
      </main>
    );
  }

  // allowed === true
  return (
    <main className="safe" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href={debugId ? { pathname: '/cabinet', query: { id: debugId } } : '/cabinet'} className="list-btn"
          onClick={() => haptic('light')}
          style={{ width: 120, textDecoration: 'none' }}>
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Admin</h1>
      </div>

      {DEBUG && <p style={{ opacity: .6, fontSize: 12 }}>{info}</p>}

      <div style={{ display: 'grid', gap: 10 }}>
        <Link href="/cabinet/admin/users" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left"><span className="list-btn__emoji">👤</span><b>Пользователи</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
        <Link href="/cabinet/admin/payments" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left"><span className="list-btn__emoji">💳</span><b>Платежи</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
        <Link href="/cabinet/admin/metrics" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left"><span className="list-btn__emoji">📈</span><b>Метрики</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
