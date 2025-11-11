'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useMemo } from 'react';

export default function MiniDock() {
  const suffix = useMemo(() => {
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

  return (
    <div className="mini-dock glass">
      <Link href={`/cabinet${suffix}` as Route} legacyBehavior>
        <a className="mini-dock__btn" aria-label="Личный кабинет">
          <span className="mini-dock__icon">👤</span>
          <span className="mini-dock__label">Кабинет</span>
        </a>
      </Link>

      <style jsx>{`
        .glass{
          background: rgba(255,255,255,.78);
          color:#0d1220;
          border:1px solid rgba(0,0,0,.08);
          box-shadow: 0 10px 28px rgba(17,23,40,.12), inset 0 0 0 1px rgba(255,255,255,.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }
        .mini-dock{
          position: fixed;
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
          border-radius: 16px;
          padding: 6px 8px;
          z-index: 90;
        }
        .mini-dock__btn{
          display: flex; align-items: center; gap: 8px;
          padding: 8px 12px; border-radius: 12px;
          text-decoration: none; color: inherit;
          font-weight: 800; letter-spacing: .02em;
        }
        .mini-dock__icon{ font-size: 18px; line-height: 1; }
        .mini-dock__label{ line-height: 1; }
      `}</style>
    </div>
  );
}
