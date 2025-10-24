/* path: app/cabinet/page.tsx */
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { readLocale, type Locale, STRINGS } from '@/lib/i18n';
import { detectPlatform } from '@/lib/platform';
import { authHeaders, ensureVkParams } from '@/lib/utils/authHeaders';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type MeResp = {
  ok: boolean;
  error?: string;
  provider?: 'vk' | 'telegram';
  via?: string;
  user?: {
    telegramId?: string;
    first_name?: string;
    last_name?: string;
    username?: string;
  } | null;
  subscription?: {
    active?: boolean;
    expiresAt?: string | null;
    till?: string | null;
    plan?: string | null;
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
function getInitDataFromCookie(): string { return getCookie('tg_init_data'); }
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
  const locale: Locale = readLocale();
  const L = STRINGS[locale] ?? STRINGS.ru;
  const platform = useMemo(() => detectPlatform(), []);
  const providerRef = useRef<'vk' | 'telegram' | undefined>(undefined);

  const _ = (key: keyof typeof L, fallback?: string) =>
    (L as any)[key] ?? (STRINGS.ru as any)[key] ?? fallback ?? String(key);

  const T = {
    back: _('back', 'Назад'),
    title: _('accountTitle', 'Личный кабинет'),
    hi: _('hello', 'Здравствуйте,'),
    welcome: _('welcome', 'Добро пожаловать!'),
    subTitle: _('subStatus', 'Статус подписки'),
    checking: _('checking', 'Проверяем подписку…'),
    buyBtn: _('buyExtend', 'Купить/продлить подписку'),
    favBtn: _('favorites', 'Избранное'),
    notActive: _('notActive', 'Подписка не активна.'),
    proActive: (until?: string | null) => {
      const fn = (L as any).proActive as (u?: string) => string;
      return typeof fn === 'function' ? fn(until || undefined) :
        (locale === 'en'
          ? `Your Pro plan is active.${until ? ` Until ${until}` : ''}`
          : `У вас подписка Pro.${until ? ` До ${until}` : ''}`);
    },
    proPlusActive: (until?: string | null) => {
      const fn = (L as any).proPlusActive as (u?: string) => string;
      return typeof fn === 'function' ? fn(until || undefined) :
        (locale === 'en'
          ? `Your Pro+ plan is active.${until ? ` Until ${until}` : ''}`
          : `У вас подписка Pro+.${until ? ` До ${until}` : ''}`);
    },
    activeGeneric: (until?: string | null) => {
      const fn = (L as any).activeGeneric as (u?: string) => string;
      return typeof fn === 'function' ? fn(until || undefined) :
        (locale === 'en'
          ? `Subscription is active.${until ? ` Until ${until}` : ''}`
          : `Подписка активна.${until ? ` До ${until}` : ''}`);
    },
  };

  const [user, setUser] = useState<MeResp['user']>(null);
  const [statusText, setStatusText] = useState(T.notActive);
  const [loading, setLoading] = useState(false);

  // admin
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminInfo, setAdminInfo] = useState<string>('');

  // debug id
  const debugId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? id : '';
    } catch { return ''; }
  }, []);

  const hrefPro   = useMemo(() => (debugId ? { pathname: '/pro' as const, query: { id: debugId } } : '/pro'), [debugId]);
  const hrefFav   = useMemo(() => (debugId ? { pathname: '/cabinet/favorites' as const, query: { id: debugId } } : '/cabinet/favorites'), [debugId]);
  const hrefAdmin = useMemo(() => (debugId ? { pathname: '/cabinet/admin' as const, query: { id: debugId } } : '/cabinet/admin'), [debugId]);

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
    } catch {}
  }, [locale]);

  async function loadMe(initData?: string) {
    setLoading(true);
    try {
      let endpoint = '/api/me';
      if (!initData && DEBUG && debugId) endpoint += `?id=${encodeURIComponent(debugId)}`;

      // всегда строим заголовки через helper,
      // он сам добавит X-Vk-Params / X-Tg-Init-Data если они доступны
      let headers = authHeaders(
        initData ? { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData } : {}
      );

      let resp = await fetch(endpoint, { method: 'POST', headers, cache: 'no-store' });

      // если мы в VK и прилетела 401 — дотянем launch-параметры и попробуем ещё раз
      if (platform === 'vk' && resp.status === 401) {
        const got = await ensureVkParams(); // вернёт true, если записал/нашёл vk_params
        if (got) {
          headers = authHeaders(
            initData ? { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData } : {}
          );
          resp = await fetch(endpoint, { method: 'POST', headers, cache: 'no-store' });
        }
      }

      const data: MeResp = await resp.json().catch(() => ({ ok: false }));

      if (data?.provider) providerRef.current = data.provider;

      // для VK сервер возвращает только telegramId — поле используем как «id …»
      if (data?.user) setUser(prev => prev ?? data.user);

      const sub = data?.subscription;
      const isActive = Boolean(sub?.active);
      const untilStr = sub?.expiresAt || sub?.till || null;
      const planNorm = normalizePlan(sub?.plan);

      if (isActive) {
        const untilTxt = untilStr ? formatDate(new Date(untilStr)) : null;
        if (planNorm === 'pro') setStatusText(T.proActive(untilTxt));
        else if (planNorm === 'pro+') setStatusText(T.proPlusActive(untilTxt));
        else setStatusText(T.activeGeneric(untilTxt));
      } else {
        setStatusText(T.notActive);
      }
    } catch {
      setStatusText(T.notActive);
    } finally {
      setLoading(false);
    }
  }

  // При VK добираем нормальным именем через bridge (чисто косметика)
  async function loadVkProfileIfPossible() {
    if (providerRef.current !== 'vk' || platform !== 'vk') return;
    try {
      const mod = await import('@vkontakte/vk-bridge');
      const bridge = (mod.default || mod) as any;
      const info = await bridge.send('VKWebAppGetUserInfo').catch(() => null);
      if (info && (info.first_name || info.last_name || info.screen_name)) {
        setUser(u => ({
          ...(u || {}),
          first_name: info.first_name || u?.first_name,
          last_name: info.last_name || u?.last_name,
          username: info.screen_name || u?.username,
        }));
      }
    } catch {}
  }

  async function checkAdmin(initData?: string) {
    try {
      let url = '/api/admin/check';
      if (!initData && DEBUG && debugId) url += `?id=${encodeURIComponent(debugId)}`;
      const headers = authHeaders(
        initData ? { 'X-Telegram-Init-Data': initData, 'X-Init-Data': initData } : {}
      );
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
    (async () => {
      // если VK — попробуем заранее подтянуть vk_params (уменьшит вероятность 401)
      if (platform === 'vk') { try { await ensureVkParams(); } catch {} }
      if (initData) {
        await loadMe(initData);
      } else if (DEBUG) {
        await loadMe();
      } else {
        await loadMe(); // VK без Telegram — всё равно попробуем по vk_params
        setIsAdmin(false);
      }
      await loadVkProfileIfPossible();
      await checkAdmin(initData);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debugId, locale, platform]);

  // В приветствии: если нет имени — показываем id из user.telegramId для VK
  const hello =
    (user?.first_name || '') +
      (user?.last_name ? ` ${user.last_name}` : '') ||
    (user?.username ? `@${user.username}` : '') ||
    (user?.telegramId ? `id ${String(user.telegramId).replace(/^vk:/,'')}` : '') ||
    '';

  return (
    <main>
      <div className="safe" style={{ padding: 20, maxWidth: 720, margin: '0 auto', display:'flex', flexDirection:'column', gap:14 }}>

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
            <span style={{ fontWeight: 600 }}>{T.back}</span>
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

        <h1 style={{ textAlign: 'center' }}>{T.title}</h1>
        <p style={{ textAlign: 'center', opacity: .85 }}>
          {hello ? <>{T.hi} <b>{hello}</b></> : T.welcome}
        </p>

        <div style={{ marginTop: 2 }}>
          <div style={{ margin: '0 auto', maxWidth: 680, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
            <h3 style={{ marginTop: 0, textAlign: 'center' }}>{T.subTitle}</h3>
            <p style={{ textAlign: 'center' }}>{loading ? T.checking : statusText}</p>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              <Link href={hrefPro} className="list-btn" style={{ textDecoration: 'none' }}>
                <span className="list-btn__left">
                  <span className="list-btn__emoji">⭐</span>
                  <b>{T.buyBtn}</b>
                </span>
                <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
              </Link>

              <Link href={hrefFav} className="list-btn" style={{ textDecoration: 'none' }}>
                <span className="list-btn__left">
                  <span className="list-btn__emoji">🌟</span>
                  <b>{T.favBtn}</b>
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
