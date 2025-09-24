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
    till?: string | null;      // вариант 2 (на всякий)
    plan?: string | null;
  } | null;
};

export default function CabinetPage() {
  const [user, setUser] = useState<MeResp['user']>(null);
  const [statusText, setStatusText] = useState('Подписка не активна.');
  const [loading, setLoading] = useState(false);

  // тащим debug id из URL и добавляем его как суффикс ко всем ссылкам
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  async function loadMe(initData?: string) {
    setLoading(true);
    try {
      let endpoint = '/api/me';
      const headers: Record<string, string> = {};

      if (initData) {
        headers['x-init-data'] = initData;
      } else if (DEBUG && linkSuffix) {
        endpoint += linkSuffix; // браузерный режим
      }

      // и GET, и POST обычно ок; оставим POST как у тебя
      const resp = await fetch(endpoint, { method: 'POST', headers, cache: 'no-store' });
      const data: MeResp = await resp.json();

      // пользователь для приветствия
      setUser(data?.user || null);

      // статус подписки (попробуем оба возможных поля даты)
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
      // не шумим ошибкой на UI
      setStatusText('Подписка не активна.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const initData: string | undefined = WebApp?.initData;
    const tgUser = WebApp?.initDataUnsafe?.user || null;
    setUser(tgUser);
    loadMe(initData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hello =
    (user?.first_name || '') +
    (user?.last_name ? ` ${user.last_name}` : '') ||
    (user?.username ? `@${user.username}` : '');

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Личный кабинет</h1>

      <p style={{ textAlign: 'center', opacity: .85 }}>
        {hello ? <>Здравствуйте, <b>{hello}</b></> : (DEBUG ? 'Браузерный режим (debug).' : 'Данные пользователя недоступны.')}
      </p>

      <div style={{ marginTop: 16 }}>
        <div style={{ margin: '0 auto', maxWidth: 680, padding: 12, border: '1px solid #333', borderRadius: 12 }}>
          <h3 style={{ marginTop: 0, textAlign: 'center' }}>Статус подписки</h3>
          <p style={{ textAlign: 'center' }}>{loading ? 'Проверяем подписку…' : statusText}</p>

          <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
            <Link href={`/pro${linkSuffix}`} className="list-btn" style={{ textDecoration: 'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">⭐</span>
                <b>Купить/продлить подписку</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>

            <Link href={`/cabinet/cases${linkSuffix}`} className="list-btn" style={{ textDecoration: 'none' }}>
              <span className="list-btn__left">
                <span className="list-btn__emoji">📁</span>
                <b>Моё дело (таймлайн и дедлайны)</b>
              </span>
              <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
            </Link>

            <Link href={`/cabinet/favorites${linkSuffix}`} className="list-btn" style={{ textDecoration: 'none' }}>
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
