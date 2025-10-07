// /lib/tma/AIChatClient.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import BackBtn from '@/components/BackBtn';
import type { Route } from 'next';

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

type Attach = {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errMsg?: string;
};

export type AIChatClientProps = {
  title: string;
  subtitle?: string;
  initialAssistant: string;
  systemPrompt: string;     // ВАЖНО: импортируешь из ./prompt
  mode: string;             // например 'pro-cinema'
  backHref?: Route;         // по умолчанию '/home'
  maxAttach?: number;       // по умолчанию 10
  passthroughIdParam?: boolean; // пробрасывать ?id= к API, по умолчанию true
};

const MAX_ATTACH_DEFAULT = 10;

function norm(s: string) {
  return (s || '').toString().trim();
}

export default function AIChatClient(props: AIChatClientProps) {
  const {
    title,
    subtitle = 'Опишите задачу — ассистент всё уточнит и поможет.',
    initialAssistant,
    systemPrompt,
    mode,
    backHref = '/home' as Route,
    maxAttach = MAX_ATTACH_DEFAULT,
    passthroughIdParam = true,
  } = props;

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: initialAssistant },
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attach, setAttach] = useState<Attach[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  // TMA ready/expand
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // автоскроллы
  useEffect(() => {
    listRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, loading, uploading]);

  useEffect(() => {
    if (!attach.length) return;
    trayRef.current?.scrollTo({ left: 9e9, behavior: 'smooth' });
  }, [attach.length]);

  // пробрасываем ?id=
  const idSuffix = useMemo(() => {
    if (!passthroughIdParam) return '';
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, [passthroughIdParam]);

  // корзина вложений
  const addFilesFromPicker = useCallback((list: FileList | null) => {
    const files = Array.from(list || []);
    if (!files.length) return;

    setAttach(prev => {
      const next = [...prev];
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue;
        if (next.length >= maxAttach) break;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const previewUrl = URL.createObjectURL(f);
        next.push({ id, file: f, previewUrl, status: 'pending' });
      }
      return next;
    });

    if (pickerRef.current) pickerRef.current.value = '';
  }, [maxAttach]);

  const removeAttach = useCallback((id: string) => {
    setAttach(prev => {
      const a = prev.find(x => x.id === id);
      if (a) URL.revokeObjectURL(a.previewUrl);
      return prev.filter(x => x.id !== id);
    });
  }, []);

  // отправка
  const send = useCallback(async () => {
    const t = norm(text);
    if ((!t && attach.length === 0) || loading || uploading) return;

    setLoading(true);
    setUploading(true);

    setMessages(m => [
      ...m,
      { role: 'user',
        content: (t || '(сообщение без текста)') +
          (attach.length ? `\n📎 Вложений: ${attach.length}` : '')
      },
    ]);

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < attach.length; i++) {
        const it = attach[i];
        setAttach(prev => prev.map(x => (x.id === it.id ? { ...x, status: 'uploading' } : x)));

        const fd = new FormData();
        fd.append('file', it.file);
        // @ts-ignore
        const initData = window?.Telegram?.WebApp?.initData || '';

        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 60_000);
        let res: Response;
        try {
          res = await fetch('/api/upload-image' + idSuffix, {
            method: 'POST',
            body: fd,
            headers: { 'X-Tg-Init-Data': initData },
            signal: ctrl.signal,
          });
        } finally { clearTimeout(to); }

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok || !data?.url) throw new Error(data?.error || 'Upload failed');

        uploadedUrls.push(String(data.url));
        setAttach(prev =>
          prev.map(x => (x.id === it.id ? { ...x, status: 'done', uploadedUrl: data.url } : x)),
        );
      }
    } catch (e: any) {
      setAttach(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        return prev.map(x =>
          x.id === last.id ? { ...x, status: 'error', errMsg: String(e?.message || 'Ошибка') } : x
        );
      });
      setMessages(m => [...m, { role: 'assistant',
        content: 'Не удалось загрузить все вложения. Попробуем ещё раз?' }]);
      setUploading(false);
      setLoading(false);
      return;
    }

    const imagesNote = uploadedUrls.length
      ? '\n\nПрикреплённые изображения:\n' + uploadedUrls.map(u => `- ${u}`).join('\n')
      : '';
    const promptText = (t || '') + imagesNote;

    try {
      const history = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system'),
        { role: 'user', content: promptText } as Msg,
      ].slice(-20) as Msg[];

      const r = await fetch('/api/assistant/ask' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, history, images: uploadedUrls, mode }),
      });

      const data = await r.json().catch(() => ({} as any));
      if (data?.ok) {
        const reply = String(data.answer || '').trim();
        setMessages(m => [...m, { role: 'assistant', content: reply || 'Готово. Продолжим?' }]);
      } else if (data?.error === 'FREE_LIMIT_REACHED') {
        const msg = `Исчерпан дневной бесплатный лимит (${data?.freeLimit ?? 0}). ` +
                    `Оформите Pro или попробуйте завтра.`;
        setMessages(m => [...m, { role: 'assistant', content: msg }]);
      } else {
        setMessages(m => [...m, { role: 'assistant',
          content: 'Сервис временно недоступен. Попробуем ещё раз?' }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant',
        content: 'Не получилось получить ответ. Попробуем ещё раз?' }]);
    } finally {
      setLoading(false);
      setUploading(false);
      setText('');
      setAttach(prev => { prev.forEach(a => URL.revokeObjectURL(a.previewUrl)); return []; });
    }
  }, [attach, idSuffix, loading, mode, systemPrompt, text, uploading, messages]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        gap: 12,
        padding: '12px 12px calc(12px + env(safe-area-inset-bottom))',
      }}
    >
      <div>
        <BackBtn fallback={backHref} />
        <h1
          style={{
            textAlign: 'center',
            marginTop: 8,
            fontSize: 22,
            fontWeight: 800,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {title}
        </h1>
        {!!subtitle && (
          <p style={{ textAlign: 'center', opacity: .75, marginTop: -4 }}>{subtitle}</p>
        )}
      </div>

      {/* Лента сообщений */}
      <div ref={listRef} style={{ minHeight: 0, overflow: 'auto', padding: '4px 2px' }}>
        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div
            key={i}
            style={{
              margin: '10px 0',
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '86%',
                padding: '10px 12px',
                borderRadius: 14,
                lineHeight: 1.5,
                background: m.role === 'user' ? '#24304a' : '#1a2132',
                border: '1px solid #2b3552',
                whiteSpace: 'pre-wrap',
                fontSize: 16
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {(loading || uploading) && (
          <div style={{ opacity: .6, fontSize: 13, padding: '6px 2px' }}>
            {uploading ? 'Думаю...' : 'Думаю…'}
          </div>
        )}
      </div>

      {/* Трей вложений */}
      {!!attach.length && (
        <div
          ref={trayRef}
          style={{
            overflowX: 'auto',
            display: 'flex',
            gap: 10,
            padding: '8px 4px',
            borderRadius: 14,
            background: 'rgba(9, 13, 22, 0.6)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'saturate(160%) blur(8px)',
          }}
        >
          {attach.map(a => (
            <div
              key={a.id}
              style={{
                position: 'relative',
                width: 64, height: 64,
                borderRadius: 12,
                border: '1px solid #2b3552',
                overflow: 'hidden',
                flex: '0 0 auto',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.previewUrl} alt="" style={{
                width: '100%', height: '100%', objectFit: 'cover'
              }} />
              <button
                type="button"
                aria-label="Удалить"
                onClick={() => removeAttach(a.id)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 26, height: 26, borderRadius: 999,
                  border: '1px solid #2b3552', background: '#0e1422',
                  color: '#fff', fontSize: 16, lineHeight: '22px'
                }}
              >
                ×
              </button>
              {a.status === 'uploading' && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  height: 5, background: 'rgba(255,255,255,.25)'
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Нижняя панель */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          gap: 6,
          alignItems: 'center',
          padding: 8,
          borderRadius: 16,
          background: 'rgba(9, 13, 22, 0.7)',
          backdropFilter: 'saturate(160%) blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        }}
      >
        {/* плюс */}
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          aria-label="Прикрепить"
          disabled={attach.length >= maxAttach || uploading || loading}
          title={attach.length >= maxAttach ? `Достигнут лимит ${maxAttach} фото` : 'Прикрепить изображения'}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: '1px solid #2b3552', background: '#121722',
            display: 'grid', placeItems: 'center',
            fontSize: 22, lineHeight: 1,
            opacity: attach.length >= maxAttach ? .5 : 1
          }}
        >
          +
        </button>

        <input
          ref={pickerRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => addFilesFromPicker(e.target.files)}
        />

        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
          placeholder="Я вас слушаю..."
          style={{
            height: 40,
            padding: '0 12px',
            borderRadius: 12,
            border: '1px solid #2b3552',
            background: '#121722',
            color: 'var(--fg)',
            fontSize: 16,
            outline: 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        />

        <button
          onClick={send}
          disabled={(loading || uploading) || (!norm(text) && !attach.length)}
          aria-label="Отправить"
          title="Отправить"
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: '1px solid #2b3552',
            background: '#121722',
            color: 'var(--fg)',
            fontSize: 20, lineHeight: 1,
            display: 'grid',
            placeItems: 'center',
            opacity: (loading || uploading) || (!norm(text) && !attach.length) ? .6 : 1
          }}
        >
          ↑
        </button>
      </div>
    </main>
  );
}
