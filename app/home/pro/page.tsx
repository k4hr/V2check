'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import BackBtn from '../../components/BackBtn';
import CardLink, { UI_STRINGS } from '@/components/CardLink';
import type { Route } from 'next';

type ToolItem = {
  title: string;
  subtitle: string;
  icon: string;
  href: Route;
  variant?: 'default' | 'pro';
};

function norm(s: string) {
  return (s || '').toLowerCase().normalize('NFC').trim();
}

export default function ProHub() {
  const [query, setQuery] = useState('');
  const ui = UI_STRINGS.ru; // можно переключить на en при необходимости

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const q = u.searchParams.get('q');
      if (q) setQuery(q);
    } catch {}
  }, []);

  const tools = useMemo<ToolItem[]>(
    () => [
      {
        icon: '🎬',
        title: 'Выбрать фильм/сериал',
        subtitle: 'Персональный подбор — быстро и качественно',
        href: (`/home/pro/cinema${linkSuffix}` as Route),
        variant: 'pro',
      },
    ],
    [linkSuffix]
  );

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return tools;
    return tools.filter(
      (t) => norm(t.title).includes(q) || norm(t.subtitle).includes(q)
    );
  }, [query, tools]);

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.currentTarget.value),
    []
  );

  return (
    <main className="lm-wrap">
      <BackBtn fallback="/home" />

      <h1
        style={{
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        Ежедневные задачи
      </h1>
      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        {ui.chooseTool}
      </p>

      {/* Поиск — строки из словаря */}
      <div style={{ marginTop: 12 }}>
        <input
          type="search"
          inputMode="search"
          placeholder={ui.searchPlaceholder}
          aria-label={ui.searchAria}
          value={query}
          onChange={onInput}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: '#141823',
            border: '1px solid var(--border)',
            color: 'var(--fg, #fff)',
            outline: 'none'
          }}
        />
      </div>

      <div className="lm-grid" style={{ marginTop: 14 }}>
        {filtered.length === 0 ? (
          <div className="empty">{ui.notFound}</div>
        ) : (
          filtered.map((t, i) => (
            <CardLink
              key={`${t.title}-${i}`}
              href={t.href}
              icon={t.icon}
              title={t.title}
              subtitle={t.subtitle}
              variant={t.variant || 'default'}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .lm-wrap { padding: 20px; max-width: 780px; margin: 0 auto; }
        .lm-subtitle { opacity: .7; margin-top: 6px; }
        .lm-grid { display: grid; gap: 12px; }
        .empty { opacity: .7; padding: 12px 8px; text-align: center; }
      `}</style>
    </main>
  );
}
