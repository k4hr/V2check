'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

export default function CabinetPage() {
  const [user, setUser] = useState<any>(null);
  const [statusText, setStatusText] = useState<string>('Подписка не активна.');
  const [loadingStatus, setLoadingStatus] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function getDebugIdFromUrl(): string | null {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      if (id && /^\d{3,15}$/.test(id)) return id;
      return null;
    } catch { return null; }
  }

  async function loadSubscription(initData?: string) {
    setLoadingStatus(true);
    setError(null);
    try {
      let endpoint = '/api/me';
      const headers: Record<string,string> = {};
      if (initData) headers['x-init-data'] = initData;
      else if (DEBUG) {
        const id = getDebugIdFromUrl();
        if (id) endpoint = `/api/me?id=${encodeURIComponent(id)}`;
      }

      const resp = await fetch(endpoint, { method: 'POST', headers });
      const data = await resp.json();

      if (!resp.ok || !data?.ok) throw new Error(data?.error || 'Request failed');

      const sub = data?.subscription;
      if (sub?.active && sub?.expiresAt) {
        const d = new Date(sub.expiresAt);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth()+1).padStart(2, '0');
        const yyyy = d.getFullYear();
        setStatusText(`Подписка активна до ${dd}.${mm}.${yyyy}`);
      } else {
        setStatusText('Подписка не активна.');
      }
    } catch (e:any) {
      setError(e?.message || 'Ошибка запроса');
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    setUser(WebApp?.initDataUnsafe?.user || null);
    const initData = WebApp?.initData || '';
    if (initData) loadSubscription(initData);
    else if (DEBUG) loadSubscription(); // режим браузерной проверки
  }, []);

  const refresh = () => {
    try {
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      if (initData) loadSubscription(initData);
      else if (DEBUG) loadSubscription();
    } catch {}
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Личный кабинет</h1>
      {user ? (
        <p style={{ textAlign: 'center' }}>Здравствуйте, <b>{user.first_name}</b></p>
      ) : (
        <p style={{ textAlign: 'center' }}>
          {DEBUG ? 'Браузерный режим (debug).' : 'Данные пользователя недоступны.'}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <div style={{ margin: '0 auto', maxWidth: 680, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>Статус подписки</h3>
          <p style={{ textAlign: 'center' }}>
            {loadingStatus ? 'Проверяем подписку…' : statusText}
          </p>
          {error && <p style={{color:'crimson', textAlign:'center'}}>{error}</p>}

          <div style={{ display:'grid', gap:12, marginTop:12 }}>
            <button className="list-btn" onClick={refresh}
              style={{border:'1px solid #333', borderRadius:12, padding:'10px 14px'}}>
              🔄 Обновить статус
            </button>

            <Link href="/pro" className="list-btn" style={{ textDecoration:'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">⭐</span>
                <b>Купить/продлить подписку</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>

            <Link href="/cabinet/favorites" className="list-btn" style={{ textDecoration:'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">🌟</span>
                <b>Избранное</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
