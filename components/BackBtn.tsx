'use client';

import { useEffect } from 'react';

export default function BackBtn({
  fallback = '/home',
  label = 'Назад',
}: { fallback?: string; label?: string }) {
  useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    try {
      tg?.BackButton?.show?.();
      const onClick = () => {
        if (document.referrer || history.length > 1) history.back();
        else location.assign(fallback);
      };
      tg?.BackButton?.onClick?.(onClick);
      return () => {
        tg?.BackButton?.hide?.();
        tg?.BackButton?.offClick?.(onClick);
      };
    } catch {}
  }, [fallback]);

  return (
    <button
      type="button"
      onClick={() =>
        (history.length > 1 ? history.back() : location.assign(fallback))
      }
      className="list-btn"
      style={{ maxWidth: 120, marginBottom: 12 }}
    >
      ← {label}
    </button>
  );
}
