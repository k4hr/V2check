/* path: lib/tma/AIChatClient.tsx */
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import BackBtn from '@/components/BackBtn';
import type { Route } from 'next';
import { extractLeadingEmoji } from '@/lib/utils/extractEmoji';

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
  systemPrompt: string;
  mode: string;
  backHref?: Route;
  maxAttach?: number;              // default 10
  passthroughIdParam?: boolean;    // default true
};

const MAX_ATTACH_DEFAULT = 10;
const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';
const norm = (s: string) => (s || '').toString().trim();
const TG_INIT = () => (window as any)?.Telegram?.WebApp?.initData || '';

function isProPlusActiveFromResp(data: any): boolean {
  const sub = data?.subscription || null;
  if (!sub?.active) return false;
  const raw = String(sub?.plan || '').toUpperCase().replace(/\s+|[_-]/g, '');
  return raw === 'PROPLUS' || raw === 'PRO+' || raw.includes('PROPLUS');
}

type ThreadState = { id?: string; starred: boolean; busy: boolean };

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
  const [thread, setThread] = useState<ThreadState>({ starred: false, busy: false });
  const [proPlusActive, setProPlusActive] = useState<boolean>(false);

  const listRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, loading, uploading]);

  useEffect(() => {
    if (!attach.length) return;
    trayRef.current?.scrollTo({ left: 9e9, behavior: 'smooth' });
  }, [attach.length]);

  const idSuffix = useMemo(() => {
    if (!passthroughIdParam) return '';
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, [passthroughIdParam]);

  // статус подписки (для бейджа)
  useEffect(() => {
    (async () => {
      try {
        let endpoint = '/api/me';
        const headers: Record<string, string> = {};
        const init = TG_INIT();
        if (init) headers['x-init-data'] = init;
        else if (DEBUG && idSuffix) endpoint += idSuffix;

        const r = await fetch(endpoint, { method: 'POST', headers, cache: 'no-store' });
        const data = await r.json().catch(() => ({}));
        setProPlusActive(isProPlusActiveFromResp(data));
      } catch { setProPlusActive(false); }
    })();
  }, [idSuffix]);

  const collectMsgsForSave = useCallback(() => {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content || '' }));
  }, [messages]);

  const toggleStar = useCallback(async () => {
    if (thread.busy) return;
    setThread(t => ({ ...t, busy: true }));
    try {
      if (thread.id && thread.starred) {
        const r = await fetch('/api/chat-threads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Tg-Init-Data': TG_INIT() },
          body: JSON.stringify({ id: thread.id, starred: false }),
        });
        const data = await r.json();
        if (!data?.ok) throw new Error(data?.error || 'PATCH_FAILED');
        setThread({ id: thread.id, starred: false, busy: false });
        return;
      }

      let tid = thread.id;
      if (!tid) {
        const emoji = extractLeadingEmoji(title) || undefined;
        const r = await fetch('/api/chat-threads' + idSuffix, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Tg-Init-Data': TG_INIT() },
          body: JSON.stringify({ toolSlug: mode || 'chat', title, emoji, starred: true }),
        });
        const data = await r.json();
        if (data?.error === 'PRO_PLUS_REQUIRED') {
          setMessages(m => [...m, { role: 'assistant', content: 'Избранное доступно только в Pro+.' }]);
          setThread(t => ({ ...t, busy: false }));
          return;
        }
        if (!data?.ok || !data.thread?.id) throw new Error(data?.error || 'CREATE_FAILED');
        tid = String(data.thread.id);
      } else {
        const r = await fetch('/api/chat-threads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'X-Tg-Init-Data': TG_INIT() },
          body: JSON.stringify({ id: tid, starred: true }),
        });
        const data = await r.json();
        if (data?.error === 'PRO_PLUS_REQUIRED') {
          setMessages(m => [...m, { role: 'assistant', content: 'Избранное доступно только в Pro+.' }]);
          setThread(t => ({ ...t, busy: false }));
          return;
        }
        if (!data?.ok) throw new Error(data?.error || 'PATCH_FAILED');
      }

      const r2 = await fetch('/api/chat-threads/messages' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tg-Init-Data': TG_INIT() },
        body: JSON.stringify({ threadId: tid, messages: collectMsgsForSave() }),
      });
      const data2 = await r2.json();
      if (!data2?.ok) throw new Error(data2?.error || 'SAVE_MESSAGES_FAILED');

      setThread({ id: tid, starred: true, busy: false });
      setMessages(m => [...m, { role: 'assistant', content: 'Чат сохранён в избранное ★' }]);
    } catch (e: any) {
      setMessages(m => [...m, { role: 'assistant', content: 'Не удалось сохранить в избранное.' }]);
      setThread(t => ({ ...t, busy: false }));
    }
  }, [thread, collectMsgsForSave, title, mode, idSuffix]);

  // ==== отправка ====

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

  const send = useCallback(async () => {
    const t = norm(text);
    if ((!t && attach.length === 0) || loading || uploading) return;

    setLoading(true);
    setUploading(true);

    setMessages(m => [
      ...m,
      { role: 'user', content: (t || '(сообщение без текста)') + (attach.length ? `\n📎 Вложений: ${attach.length}` : '') },
    ]);

    try {
      const history = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system'),
        { role: 'user', content: t } as Msg,
      ].slice(-20) as Msg[];

      const r = await fetch('/api/assistant/ask' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: t, history, mode }),
      });

      const data = await r.json().catch(() => ({} as any));
      if (data?.ok) {
        const reply = String(data.answer || '').trim();
        setMessages(m => [...m, { role: 'assistant', content: reply || 'Готово. Продолжим?' }]);
      } else if (data?.error === 'FREE_LIMIT_REACHED') {
        const msg = `Исчерпан дневной бесплатный лимит (${data?.freeLimit ?? 0}). Оформите Pro или попробуйте завтра.`;
        setMessages(m => [...m, { role: 'assistant', content: msg }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'Сервис временно недоступен. Попробуем ещё раз?' }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Не получилось получить ответ. Попробуем ещё раз?' }]);
    } finally {
      setLoading(false);
      setUploading(false);
      setText('');
      setAttach(prev => { prev.forEach(a => URL.revokeObjectURL(a.previewUrl)); return []; });
    }
  }, [attach.length, idSuffix, loading, messages, mode, systemPrompt, text, uploading]);

  const pickDisabled = attach.length >= maxAttach || uploading || loading;

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
      <div style={{ position: 'relative' }}>
        <BackBtn fallback={backHref} />
        {/* ★ — стеклянная, светлая */}
        <button
          type="button"
          onClick={toggleStar}
          disabled={thread.busy}
          title={thread.starred ? 'Убрать из избранного' : 'Сохранить весь чат в избранное (Pro+)'}
          style={{
            position: 'absolute', top: 0, right: 0,
            width: 36, height: 36, borderRadius: 10,
            border: thread.starred ? '1px solid rgba(255,210,120,.75)' : '1px solid rgba(10,12,20,.10)',
            background: thread.starred ? 'rgba(255,210,120,.14)' : 'rgba(255,255,255,.78)',
            color: '#A8791A',
            display: 'grid', placeItems: 'center',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6), 0 10px 24px rgba(18,28,45,.10)',
            opacity: thread.busy ? .6 : 1,
            backdropFilter: 'blur(8px)',
          }}
        >
          {thread.starred ? '★' : '☆'}
        </button>

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

        {/* MINI BADGE — светлое «стекло», чёрный текст */}
        {proPlusActive && (
          <div style={{ display:'flex', justifyContent:'center', marginTop: 6 }}>
            <span
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'6px 12px', borderRadius: 999,
                background: 'linear-gradient(135deg, rgba(255,210,120,.20), rgba(255,210,120,.10)), rgba(255,255,255,.72)',
                border:'1px solid rgba(255,210,120,.45)',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,.55), 0 10px 26px rgba(255,191,73,.18)',
                backdropFilter:'blur(10px) saturate(140%)',
                color:'#0B0C10', fontWeight:700, fontSize:12, letterSpacing:.2
              }}
            >
              ✨ Pro+ активен
            </span>
          </div>
        )}
      </div>

      {/* Лента сообщений — светлые стеклянные пузыри */}
      <div ref={listRef} style={{ minHeight: 0, overflow: 'auto', padding: '4px 2px' }}>
        {messages.filter(m => m.role !== 'system').map((m, i) => {
          const isAssistant = m.role === 'assistant';

          const bubbleBase: React.CSSProperties = {
            maxWidth: '86%',
            padding: '10px 12px',
            borderRadius: 14,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            fontSize: 16,
            wordBreak: 'break-word',
            color: 'var(--text)', // ЧЁРНЫЙ/основной
            backdropFilter: 'saturate(140%) blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), 0 8px 24px rgba(18,28,45,.08)',
          };

          const bubbleStyle: React.CSSProperties = isAssistant
            ? {
                ...bubbleBase,
                background: 'rgba(255,255,255,.80)',
                border: '1px solid rgba(10,12,20,.10)',
              }
            : {
                ...bubbleBase,
                background: 'rgba(45,126,247,.10)',
                border: '1px solid rgba(45,126,247,.22)',
              };

          return (
            <div key={i} style={{
              margin: '10px 0',
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={bubbleStyle}>{m.content}</div>
            </div>
          );
        })}
        {(loading || uploading) && (
          <div style={{ opacity: .6, fontSize: 13, padding: '6px 2px' }}>
            Думаю…
          </div>
        )}
      </div>

      {/* Трей вложений — светлое стекло */}
      {!!attach.length && (
        <div
          ref={trayRef}
          style={{
            overflowX: 'auto',
            display: 'flex',
            gap: 10,
            padding: '8px 4px',
            borderRadius: 14,
            background: 'rgba(255,255,255,.78)',
            border: '1px solid rgba(10,12,20,.10)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55)',
            backdropFilter: 'saturate(140%) blur(8px)',
          }}
        >
          {attach.map(a => (
            <div key={a.id} style={{
              position: 'relative',
              width: 64, height: 64,
              borderRadius: 12,
              border: '1px solid rgba(10,12,20,.10)',
              overflow: 'hidden',
              flex: '0 0 auto',
              background: 'rgba(255,255,255,.75)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button
                type="button"
                aria-label="Удалить"
                onClick={() => removeAttach(a.id)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 26, height: 26, borderRadius: 999,
                  border: '1px solid rgba(10,12,20,.10)', background: 'rgba(255,255,255,.9)',
                  color: '#0B0C10', fontSize: 16, lineHeight: '22px'
                }}
              >×</button>
              {a.status === 'uploading' && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  height: 5, background: 'rgba(45,126,247,.25)'
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Нижняя панель — ОБЕРНУТО В lm-composer */}
      <div className="lm-composer">
        {/* Плюс + прозрачный file input поверх */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label="Прикрепить"
            disabled={pickDisabled}
            title={attach.length >= maxAttach ? `Достигнут лимит ${maxAttach} фото` : 'Прикрепить изображения'}
            className="lm-composer__btn"
            style={{ opacity: pickDisabled ? .5 : 1 }}
          >
            +
          </button>
          <input
            ref={pickerRef}
            type="file"
            accept="image/*"
            multiple
            disabled={pickDisabled}
            onChange={(e) => addFilesFromPicker(e.target.files)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: pickDisabled ? 'default' : 'pointer' }}
          />
        </div>

        {/* Поле ввода */}
        <div className="lm-composer__field">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
            placeholder="Я вас слушаю..."
            type="text"
          />
        </div>

        {/* Кнопка отправки */}
        <button
          onClick={send}
          disabled={(loading || uploading) || (!norm(text) && !attach.length)}
          aria-label="Отправить"
          title="Отправить"
          className="lm-composer__btn"
          style={{ opacity: (loading || uploading) || (!norm(text) && !attach.length) ? .6 : 1 }}
        >
          ↑
        </button>
      </div>
    </main>
  );
}
