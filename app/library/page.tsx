'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
// Если у тебя есть FREE_LIMIT в lib/catalog — используем. Иначе дефолт 2.
let FREE_LIMIT_FALLBACK = 2;
try {
  // @ts-ignore — модуль может отсутствовать в ранних версиях
  const cat = await import('@/lib/catalog');
  if (cat?.FREE_LIMIT && typeof cat.FREE_LIMIT === 'number') FREE_LIMIT_FALLBACK = cat.FREE_LIMIT;
} catch {}

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type SubResp = {
  ok: boolean;
  user?: { telegramId?: string };
  subscription?: { active: boolean; expiresAt?: string | null };
};

export default function LibraryPage() {
  const [userName, setUserName] = useState<string | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function getDebugId(): string | null {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      if (id && /^\d{3,15}$/.test(id)) return id;
      return null;
    } catch {
      return null;
    }
  }

  async function loadMe(initData?: string) {
    setErr(null);
    try {
      let endpoint = '/api/me';
      const headers: Record<string, string> = {};
      if (initData) headers['x-init-data'] = initData;
      else if (DEBUG) {
        const id = getDebugId();
        if (id) endpoint = `/api/me?id=${encodeURIComponent(id)}`;
      }
      const resp = await fetch(endpoint, { method: 'POST', headers });
      const data: SubResp = await resp.json();
      if (!resp.ok || !data?.ok) throw new Error(data as any);

      const active = !!data?.subscription?.active;
      setIsPro(active);
      setExpiresAt(data?.subscription?.expiresAt ?? null);
    } catch (e: any) {
      setErr('Не удалось получить статус подписки');
      setIsPro(false);
      setExpiresAt(null);
    }
  }

  useEffect(() => {
    try {
      const tg: any = (window as any).Telegram?.WebApp;
      tg?.ready?.();
      tg?.expand?.();
      setUserName(tg?.initDataUnsafe?.user?.username || tg?.initDataUnsafe?.user?.first_name || null);

      const initData = tg?.initData || '';
      if (initData) loadMe(initData);
      else if (DEBUG) loadMe();
    } catch {
      // Браузерный режим без TMA
      if (DEBUG) loadMe();
    }
  }, []);

  // Текст шапки: если Pro — показываем подписку. Иначе лимит.
  let headerText: JSX.Element = (
    <span>
      Здравствуйте{userName ? `, ${userName}` : ''}. Сегодня бесплатно: {FREE_LIMIT_FALLBACK}{' '}
      документ(а). Для безлимита — <Link href="/pro" style={{ textDecoration: 'underline' }}>оформите Pro</Link>.
    </span>
  );
  if (isPro) {
    const human = (() => {
      if (!expiresAt) return null;
      const d = new Date(expiresAt);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}.${mm}.${yyyy}`;
    })();
    headerText = (
      <span>
        Здравствуйте{userName ? `, ${userName}` : ''}. У вас оформлена подписка <b>Juristum Pro</b>
        {human ? ` до ${human}` : ''}.
      </span>
    );
  }

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Каталог</h1>
      <p style={{ opacity: 0.8, textAlign: 'center', maxWidth: 700, margin: '0 auto' }}>
        {headerText}
      </p>
      {err && <p style={{ color: 'crimson', textAlign: 'center' }}>{err}</p>}

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Link href="/library/constitution" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🧻</span>
            <b>Конституция РФ</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href="/library/codes" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">⚖️</span>
            <b>Кодексы РФ</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href="/library/charters" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">📘</span>
            <b>Уставы</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href="/library/pdd" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🚗</span>
            <b>ПДД</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href="/library/federal-laws" className="list-btn" prefetch={false} style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🏛️</span>
            <b>Федеральные законы</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
