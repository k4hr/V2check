'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type MeResp = {
  ok: boolean;
  error?: string;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  } | null;
  subscription?: {
    active?: boolean;
    expiresAt?: string | null; // вариант 1
    till?: string | null;      // вариант 2
    plan?: string | null;
  } | null;
};

/* ------------ helpers ------------- */
// Без regex, чтобы не ломать сборку
function getCookie(name: string): string {
  try {
    const rows = document.cookie ? document.cookie.split('; ') : [];
    for (const row of rows) {
      const [k, ...rest] = row.split('=');
      if (decodeURIComponent(k) === name) {
        return decodeURIComponent(rest.join('='));
      }
    }
  } catch {}
  return '';
}

function parseUserFromInitCookie(): MeResp['user'] {
  try {
    const raw = getCookie('tg_init_data');
    if (!raw) return null;
    const sp = new URLSearchParams(raw);
    const u = sp.get('user');
    return u ? (JSON.parse(u) as any) : null;
  } catch {
    return null;
  }
}

function getInitDataFromCookie(): string {
  return getCookie('tg_init_data');
}
/* ---------------------------------- */

export default function CabinetPage() {
  const [user, setUser] = useState<MeResp['user']>(null);
  const [statusText, setStatusText] = useState('Подписка не активна.');
  const [loading, setLoading] = useState(false);

  // debug id из URL (для браузерного режима)
  const debugId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? id : '';
    } catch {
      return '';
    }
  }, []);

  // typedRoutes-совместимые href
  const hrefPro = useMemo(
    () => (debugId ? { pathname: '/pro' as const, query: { id: debugId } } : '/pro'),
    [debugId]
  );
  const hrefCases = useMemo(
    () => (debugId ? { pathname: '/cabinet/cases' as const, query: { id: debugId } } : '/cabinet/cases'),
    [debugId]
  );
  const hrefFav = useMemo(
    () => (debugId ? { pathname: '/cabinet/favorites' as const, query: { id: debugId } } : '/cabinet/favorites'),
    [debugId]
  );

  async function loadMe(initData?: string) {
    setLoading(true);
    try {
      let endpoint = '/api/me';
      const headers: Record<string, string> = {};

      if (initData) {
        headers['x-init-data'] = initData;
      } else if (DEBUG && debugId) {
        endpoint += `?id=${encodeURIComponent(debugId)}`;
      }

      const resp = await fetch(endpoint, { method: 'POST', headers, cache: 'no-store' });
      const data: MeResp = await resp.json();

      if (data?.user) setUser((prev) => prev ?? data.user);

      const sub = data?.subscription;
      const isActive = Boolean(sub?.active);
      const until = sub?.expiresAt || sub?.till;

      if (isActive && until) {
        const d = new Date(until);
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        setStatusText(`Подписка активна до ${dd}.${mm}.${yyyy}`);
      } else if (isActive) {
        setStatusText('Подписка активна.');
      } else {
        setStatusText('Подписка не активна.');
      }
    } catch {
      setStatusText('Подписка не активна.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}

    // 1) сначала — user из Telegram
    let u = WebApp?.initDataUnsafe?.user || null;
    // 2) если нет — из куки
    if (!u) u = parseUserFromInitCookie();
    setUser(u);

    const initData = WebApp?.initData || getInitDataFromCookie();
    if (initData) loadMe(initData);
    else if (DEBUG) loadMe();
  }, [debugId]);

  const hello =
    (user?.first_name || '') +
    (user?.last_name ? ` ${user.last_name}` : '') ||
    (user?.username ? `@${user.username}` : '') ||
    '';

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Личный кабинет</h1>

      <p style={{ textAlign: 'center', opacity: .85 }}>
        {hello ? <>Здравствуйте, <b>{hello}</b></> : 'Добро пожаловать!'}
      </p>

      <div style={{ marginTop: 16 }}>
        <div style={{ margin: '0 auto', maxWidth: 680, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>Статус подписки</h3>
          <p style={{ textAlign: 'center' }}>{loading ? 'Проверяем подписку…' : statusText}</p>

          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <Link href={hrefPro} className="list-btn" style={{ textDecoration: 'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">⭐</span>
                <b>Купить/продлить подписку</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>

            <Link href={hrefCases} className="list-btn" style={{ textDecoration: 'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">📁</span>
                <b>Моё дело (таймлайн и дедлайны)</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>

            <Link href={hrefFav} className="list-btn" style={{ textDecoration: 'none' }}>
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
