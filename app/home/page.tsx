'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useI18n } from '@/components/I18nProvider';

export default function Home() {
  const { t } = useI18n();

  useEffect(() => {
    const w: any = window;
    w?.Telegram?.WebApp?.ready?.();
    w?.Telegram?.WebApp?.expand?.();
  }, []);

  return (
    <main style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>{t('app.title')}</h1>

      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <Link href={'/cabinet' as any} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">👤</span>
            <b>{t('menu.cabinet')}</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={'/pro' as any} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">⭐</span>
            <b>{t('menu.pro')}</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        <Link href={'/assistant' as any} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">📚</span>
            <b>{t('menu.assistant')}</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>

        {/* Не обязателен: вставляй, если у тебя есть маршрут */}
        <Link href={'/pro-plus-chat' as any} className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left">
            <span className="list-btn__emoji">🤖</span>
            <b>{t('menu.proplus')}</b>
          </span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>
    </main>
  );
}
