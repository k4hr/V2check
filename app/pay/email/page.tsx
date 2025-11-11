/* path: app/pay/email/page.tsx  (или app/(tg)/pay/email/page.tsx) */
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { readLocale, STRINGS, type Locale } from '@/lib/i18n';
import BackBtn from '@/app/components/BackBtn';
import type { Route } from 'next';

export default function EmailForReceiptPage() {
  const locale: Locale = readLocale();
  const S = STRINGS[locale];

  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('lm_email') || '';
      if (saved) setEmail(saved);
    } catch {}
    try {
      document.documentElement.lang = locale;
      const w: any = window;
      w?.Telegram?.WebApp?.ready?.();
      w?.Telegram?.WebApp?.expand?.();
    } catch {}
  }, [locale]);

  const fallback = useMemo<Route>(() => {
    try {
      const url = new URL(location.href);
      return (url.searchParams.get('return') || '/pro') as Route;
    } catch {
      return '/pro' as Route;
    }
  }, []);

  const T = {
    title: locale === 'en' ? 'Email for the receipt' : 'Email для чека',
    sub:
      locale === 'en'
        ? 'We need your email to send a fiscal receipt.'
        : 'Нужен email, чтобы отправить онлайн-чек.',
    ph: 'your@email.com',
    save: locale === 'en' ? 'Save and continue' : 'Сохранить и продолжить',
    invalid: locale === 'en' ? 'Enter a valid email' : 'Введите корректный email',
  };

  function valid(s: string) {
    return /^\S+@\S+\.\S+$/.test(s);
  }

  function onSubmit() {
    if (!valid(email.trim())) {
      setMsg(T.invalid);
      return;
    }
    try { localStorage.setItem('lm_email', email.trim()); } catch {}
    // возвращаемся на источник
    window.location.href = fallback;
  }

  return (
    <main className="wrap">
      <BackBtn fallback={fallback} />

      <h1 className="title">{T.title}</h1>
      <p className="sub">{T.sub}</p>
      {msg && <p className="err">{msg}</p>}

      <label className="line glass">
        <input
          type="email"
          inputMode="email"
          placeholder={T.ph}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSubmit(); }}
        />
      </label>

      <button type="button" className="go glass" onClick={onSubmit}>
        {T.save}
      </button>

      <style jsx>{`
        .wrap { max-width: 640px; margin: 0 auto; padding: 20px; display: grid; gap: 14px; }
        .title { text-align: center; margin: 6px 0 2px; color: #0d1220; }
        .sub { text-align: center; margin-top: -6px; color: #2b3142; opacity: .9; }
        .err { color: #d43b5e; text-align: center; }

        /* белое стекло */
        .glass {
          background: rgba(255,255,255,.82);
          color: #0d1220;
          border: 1px solid rgba(13,18,32,.10);
          border-radius: 14px;
          box-shadow:
            0 10px 28px rgba(17,23,40,.12),
            inset 0 0 0 1px rgba(255,255,255,.55);
          backdrop-filter: saturate(160%) blur(14px);
          -webkit-backdrop-filter: saturate(160%) blur(14px);
        }

        .line {
          padding: 4px;
        }
        .line input {
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0d1220;
          padding: 12px 12px;
          font-size: 16px;
          border-radius: 10px;
        }
        .line input::placeholder { color: rgba(13,18,32,.55); }

        .go {
          padding: 14px 16px;
          font-weight: 800;
          text-align: center;
          cursor: pointer;
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        }
        .go:active { transform: translateY(1px); }
      `}</style>
    </main>
  );
}
