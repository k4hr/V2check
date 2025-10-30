/* path: app/pay/email/page.tsx */
'use client';

import React, { useEffect, useState } from 'react';
import { readLocale, STRINGS, type Locale } from '@/lib/i18n';

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
    try { document.documentElement.lang = locale; } catch {}
  }, [locale]);

  const T = {
    back: S.back || 'Назад',
    title: locale === 'en' ? 'Email for the receipt' : 'Email для чека',
    sub: locale === 'en'
      ? 'We need your email to send a fiscal receipt.'
      : 'Нужен email, чтобы отправить онлайн-чек.',
    ph: locale === 'en' ? 'your@email.com' : 'your@email.com',
    save: locale === 'en' ? 'Save and continue' : 'Сохранить и продолжить',
    invalid: locale === 'en' ? 'Enter a valid email' : 'Введите корректный email',
  };

  function goBack() {
    if (document.referrer) history.back();
    else window.location.href = '/pro';
  }

  function validate(s: string) {
    return /^\S+@\S+\.\S+$/.test(s);
  }

  function onSubmit() {
    if (!validate(email.trim())) {
      setMsg(T.invalid);
      return;
    }
    try { localStorage.setItem('lm_email', email.trim()); } catch {}
    const url = new URL(location.href);
    const ret = url.searchParams.get('return') || '/pro';
    window.location.href = ret;
  }

  return (
    <main>
      <div className="safe">
        <button type="button" onClick={goBack} className="back"><span>←</span><b>{T.back}</b></button>
        <h1 className="title">{T.title}</h1>
        <p className="sub">{T.sub}</p>
        {msg && <p className="err">{msg}</p>}

        <label className="email-line">
          <input
            type="email"
            inputMode="email"
            placeholder={T.ph}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <button type="button" className="go" onClick={onSubmit}>{T.save}</button>
      </div>

      <style jsx>{`
        .safe { max-width: 600px; margin: 0 auto; display:flex; flex-direction:column; gap:14px; padding:20px; }
        .title { text-align:center; margin: 6px 0 2px; }
        .sub { opacity:.8; text-align:center; margin-top:-6px; }
        .err { color:#ff4d6d; text-align:center; }
        .back {
          width: 120px; padding: 10px 14px; border-radius: 12px;
          background:#171a21; border:1px solid var(--border);
          display:flex; align-items:center; gap:8px;
        }
        .email-line input{
          width:100%; padding:12px 14px; border-radius:12px;
          background:#121722; border:1px solid rgba(255,255,255,.08);
          color:#fff;
        }
        .go{
          width:100%; padding:14px 16px; border-radius:14px;
          background:linear-gradient(135deg, rgba(120,170,255,.35), rgba(120,170,255,.18));
          border:1px solid rgba(120,170,255,.45);
          color:#fff; font-weight:800;
        }
      `}</style>
    </main>
  );
}
