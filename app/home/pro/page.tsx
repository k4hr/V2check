'use client';

import { useEffect, useMemo } from 'react';
import BackBtn from '../../components/BackBtn';
import CardLink from '@/components/CardLink';
import type { Route } from 'next';

export default function ProHub() {
  useEffect(() => {
    const w: any = window;
    try {
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, []);

  // Пробрасываем ?id= чтобы не терять дебаг/Pro в ссылках
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch {
      return '';
    }
  }, []);

  return (
    <main className="lm-wrap">
      <BackBtn fallback="/home" />

      <h1 style={{ textAlign: 'center' }}>Ежедневные задачи — Pro</h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        Ежедневные инструменты для вашего удобства.
      </p>

      <div className="lm-grid" style={{ marginTop: 16 }}>
        {/* Оставляем только готовую функцию: подбор фильма/сериала */}
        <CardLink
          href={`/home/pro/cinema${linkSuffix}` as Route}
          icon="🎬"
          title="Выбрать фильм/сериал"
          subtitle="Персональный подбор — быстро и качественно"
          variant="pro"
        />
      </div>

      <style jsx>{`
        .lm-wrap { padding: 20px; max-width: 780px; margin: 0 auto; }
        .lm-subtitle { opacity: .7; margin-top: 6px; }
        .lm-grid { display: grid; gap: 12px; }
      `}</style>
    </main>
  );
}
