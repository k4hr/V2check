'use client';

import { useEffect } from 'react';

type Props = {
  fallback?: string;
  label?: string;
  maxWidth?: number;
};

export default function BackBtn({
  fallback = '/home',
  label = '← Назад',
  maxWidth = 120,
}: Props) {
  useEffect(() => {
    try {
      const tg: any = (window as any).Telegram?.WebApp;
      const goBack = () => {
        if (history.length > 1) history.back();
        else location.assign(fallback);
      };
      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(goBack);
      return () => {
        tg?.BackButton?.offClick?.(goBack);
        tg?.BackButton?.hide?.();
      };
    } catch {}
  }, [fallback]);

  return (
    <button
      type="button"
      onClick={() => (history.length > 1 ? history.back() : location.assign(fallback))}
      className="list-btn"
      style={{ maxWidth, marginBottom: 12 }}
    >
      {label}
    </button>
  );
}
