// app/cabinet/page.tsx
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
    expiresAt?: string | null;
    till?: string | null;
    plan?: string | null; // ожидаем 'pro', 'pro+', 'pro-plus', 'pro_plus', 'proplus'
  } | null;
};

type AdminCheck = { ok: boolean; admin?: boolean; id?: string | null; via?: string; error?: string };

/* ------------ helpers ------------- */
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
  } catch { return null; }
}
function getInitDataFromCookie(): string {
  return getCookie('tg_init_data');
}
function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}
function goBackFallback() {
  if (document.referrer && window.history.length > 1) history.back();
  else window.location.href = '/home';
}
function formatDate(d: Date) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
function normalizePlan(plan?: string | null): 'pro' | 'pro+' | null {
  if (!plan) return null;
  const p = plan.toLowerCase().replace(/\s+/g, '').replace(/_/g, '-');
  if (p === 'pro') return 'pro';
  if (p === 'pro+' || p === 'pro-plus' || p === 'proplus') return 'pro+';
  return null;
}
/* ---------------------------------- */

export default function CabinetPage() {
  const [user, setUser] = useState<MeResp['user']>(null);
  const [statusText, setStatusText] = useState('Подписка не активна.');
  const [loading, setLoading] = useState(false);

  // admin visibility
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminInfo, setAdminInfo] = useState<string>('');

  // debug id из URL (для браузерного режима)
  const debugId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? id : '';
    } catch { return ''; }
  }, []);

  // typedRoutes-совместимые href
  const hrefPro = useMemo(
    () => (debugId ? { pathname: '/pro' as const, query: { id: debugId } } : '/pro'),
    [debugId]
  );
  const hrefFav = useMemo(
    () => (debugId ? { pathname: '/cabinet/favorites' as const, query: { id: debugId } } : '/cabinet/favorites'),
    [debugId]
  );
  const hrefAdmin = useMemo(
    () => (debugId ? { pathname: '/cabinet/admin' as const, query: { id: debugId } } : '/cabinet/admin'),
    [debugId]
  );

  async function loadMe(initData?: string) {
    setLoading(true);
    try {
      let endpoint = '/api/me';
      const headers: Record<string, string> = {};
      if (initData) headers['x-init-data'] = initData;
      else if (DEBUG && debugId) endpoint += `?id=${encodeURIComponent(debugId)}`;

      const resp = await fetch(endpoint, { method: 'POST', headers, cache: 'no-store' });
      const data: MeResp = await resp.json();

      if (data?.user) setUser(prev => prev ?? data.user);

      const sub = data?.subscription;
      const isActive = Boolean(sub?.active);
      const untilStr = sub?.expiresAt || sub?.till || null;
      const planNorm = normalizePlan(sub?.plan);

      if (isActive) {
        // если активна — формируем надпись по плану
        const untilTxt = untilStr ? formatDate(new Date(untilStr)) : null;

        if (planNorm === 'pro') {
          setStatusText(`У вас подписка Pro.${untilTxt ? ` До ${untilTxt}` : ''}`);
        } else if (planNorm === 'pro+') {
          setStatusText(`У вас подписка Pro+.${untilTxt ? ` До ${untilTxt}` : ''}`);
        } else {
          // неизвестное имя плана — общий текст
          setStatusText(untilTxt ? `Подписка активна до ${untilTxt}` : 'Подписка активна.');
        }
      } else {
        setStatusText('Подписка не активна.');
      }
    } catch {
      setStatusText('Подписка не активна.');
    } finally {
      setLoading(false);
    }
  }

  async function checkAdmin(initData?: string) {
    try {
      const headers: Record<string, string> = {};
      if (initData) headers['x-init-data'] = initData;

      let url = '/api/admin/check';
      if (!initData && DEBUG && debugId) url += `?id=${encodeURIComponent(debugId)}`;

      const r = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      const data: AdminCheck = await r.json().catch(() => ({ ok: false }));
      setIsAdmin(Boolean(data?.admin));
      if (DEBUG) setAdminInfo(`id=${data?.id || 'n/a'} via=${data?.via || 'n/a'} admin=${String(data?.admin)}`);
    } catch {
      setIsAdmin(false);
      if (DEBUG) setAdminInfo('check error');
    }
  }

  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}

    // TWA BackButton
    try {
      tg?.BackButton?.show?.();
      const back = () => { haptic('light'); goBackFallback(); };
      tg?.BackButton?.onClick?.(back);
      return () => { tg?.BackButton?.hide?.(); tg?.BackButton?.offClick?.(back); };
    } catch {}
  }, []);

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    let u = WebApp?.initDataUnsafe?.user || null;
    if (!u) u = parseUserFromInitCookie();
    setUser(u);

    const initData = WebApp?.initData || getInitDataFromCookie();
    if (initData) {
      loadMe(initData);
      checkAdmin(initData);
    } else if (DEBUG) {
      loadMe();
      checkAdmin();
    } else {
      setIsAdmin(false);
    }
  }, [debugId]);

  const hello =
    (user?.first_name || '') +
    (user?.last_name ? ` ${user.last_name}` : '') ||
    (user?.username ? `@${user.username}` : '') ||
    '';

  return (
    <main>
      <div className="safe" style={{ padding: 20, maxWidth: 720, margin: '0 auto', display:'flex', flexDirection:'column', gap:14 }}>

        {/* Верхняя панель: Назад + (условно) Admin */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <button
            type="button"
            onClick={() => { haptic('light'); goBackFallback(); }}
            className="list-btn"
            style={{
              width: 120,
              padding: '10px 14px',
              borderRadius: 12,
              background: '#171a21',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
            <span style={{ fontWeight: 600 }}>Назад</span>
          </button>

          {isAdmin ? (
            <Link
              href={hrefAdmin}
              className="list-btn"
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                background: '#171a21',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                fontWeight: 700
              }}
            >
              admin
            </Link>
          ) : <span /> }
        </div>

        {DEBUG && isAdmin !== null && (
          <div style={{ fontSize: 12, opacity: .5, marginTop: -6 }}>{adminInfo}</div>
        )}

        <h1 style={{ textAlign: 'center' }}>Личный кабинет</h1>
        <p style={{ textAlign: 'center', opacity: .85 }}>
          {hello ? <>Здравствуйте, <b>{hello}</b></> : 'Добро пожаловать!'}
        </p>

        <div style={{ marginTop: 2 }}>
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
    </main>
  );
}
