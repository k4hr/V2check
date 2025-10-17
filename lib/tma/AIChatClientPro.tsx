'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import BackBtn from '@/components/BackBtn';
import type { Route } from 'next';
import { extractLeadingEmoji } from '@/lib/utils/extractEmoji';

export type Msg = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // изображения от ассистента (Pro+ фича)
};

type Attach = {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errMsg?: string;
};

export type AIChatClientProProps = {
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

/* ---- helpers ---- */
function isProPlusActiveFromResp(data: any): boolean {
  const sub = data?.subscription || null;
  if (!sub?.active) return false;
  const raw = String(sub?.plan || '').toUpperCase().replace(/\s+|[_-]/g, '');
  return raw === 'PROPLUS' || raw === 'PRO+' || raw.includes('PROPLUS');
}
// вытащить ссылки на изображения из текста
function extractImageUrlsFromText(text: string): string[] {
  const urls = new Set<string>();
  const re = /(https?:\/\/[^\s)]+?\.(?:png|jpe?g|webp|gif))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) urls.add(m[1]);
  return Array.from(urls);
}
// корректное открытие ссылок внутри TG WebApp / браузера
function openLink(url: string) {
  try {
    const tg: any = (window as any)?.Telegram?.WebApp;
    if (tg?.openLink) { tg.openLink(url); return; }
    if (tg?.openTelegramLink) { tg.openTelegramLink(url); return; }
  } catch {}
  window.open(url, '_blank', 'noopener,noreferrer');
}

type ThreadState = { id?: string; starred: boolean; busy: boolean };

export default function AIChatClientPro(props: AIChatClientProProps) {
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

  // NEW: состояние подписки
  const [proPlusActive, setProPlusActive] = useState<boolean>(false);

  const listRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  // Telegram WebApp
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // авто-скролл ленты
  useEffect(() => {
    listRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, loading, uploading]);

  // авто-скролл трейа вложений
  useEffect(() => {
    if (!attach.length) return;
    trayRef.current?.scrollTo({ left: 9e9, behavior: 'smooth' });
  }, [attach.length]);

  // ?id= и ?thread=
  const idSuffix = useMemo(() => {
    if (!passthroughIdParam) return '';
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, [passthroughIdParam]);

  // NEW: загрузка статуса подписки для бейджа
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
      } catch {
        setProPlusActive(false);
      }
    })();
  }, [idSuffix]);

  useEffect(() => {
    // автозагрузка сохранённого треда: /chat?thread=xxx
    try {
      const u = new URL(window.location.href);
      const tid = u.searchParams.get('thread');
      if (!tid) return;
      (async () => {
        try {
          const r = await fetch(`/api/chat-threads?id=${encodeURIComponent(tid)}`, {
            headers: { 'X-Tg-Init-Data': TG_INIT() }
          });
          const data = await r.json();
          if (data?.ok) {
            const loaded = (data?.messages || []) as Msg[];
            setMessages([{ role: 'system', content: systemPrompt }, ...loaded]);
            setThread({ id: data.thread.id, starred: !!data.thread.starred, busy: false });
          }
        } catch {}
      })();
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // собрать сообщения для сохранения
  const collectMsgsForSave = useCallback(() => {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content === '(изображения)' ? '' : (m.content || ''),
        images: Array.isArray(m.images) ? m.images : undefined,
      }));
  }, [messages]);

  // создать тред и/или переключить звезду
  const toggleStar = useCallback(async () => {
    if (thread.busy) return;
    setThread(t => ({ ...t, busy: true }));

    try {
      // если выключаем — просто PATCH
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

      // включаем — если треда нет, создаём
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
        // есть тред — дожмём звезду
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

      // залить весь текущий чат
      const payload = { threadId: tid, messages: collectMsgsForSave() };
      const r2 = await fetch('/api/chat-threads/messages' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tg-Init-Data': TG_INIT() },
        body: JSON.stringify(payload),
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

  // ==== остальной код отправки ====

  const listRefLocal = listRef; // (ничего не менял ниже)
  const [/* state above */] = [];

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

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < attach.length; i++) {
        const it = attach[i];
        setAttach(prev => prev.map(x => (x.id === it.id ? { ...x, status: 'uploading' } : x)));

        const fd = new FormData();
        fd.append('file', it.file);
        const initData = TG_INIT();

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
        setAttach(prev => prev.map(x => (x.id === it.id ? { ...x, status: 'done', uploadedUrl: data.url } : x)));
      }
    } catch (e: any) {
      setAttach(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        return prev.map(x => x.id === last.id ? { ...x, status: 'error', errMsg: String(e?.message || 'Ошибка') } : x);
      });
      setMessages(m => [...m, { role: 'assistant', content: 'Не удалось загрузить все вложения. Попробуем ещё раз?' }]);
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

        // собрать список картинок из ответа
        const serverImages: string[] = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
        const fromText = extractImageUrlsFromText(reply);
        const uniqueImages = Array.from(new Set([...(serverImages || []), ...(fromText || [])]));

        if (reply.replace(/\s+/g, '').length) {
          setMessages(m => [...m, { role: 'assistant', content: reply }]);
        }
        if (uniqueImages.length) {
          setMessages(m => [...m, { role: 'assistant', content: '(изображения)', images: uniqueImages }]);
        }
        if (!reply && !uniqueImages.length) {
          setMessages(m => [...m, { role: 'assistant', content: 'Готово. Продолжим?' }]);
        }
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
  }, [attach, idSuffix, loading, mode, systemPrompt, text, uploading, messages]);

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
        {/* ★ в правом верхнем углу */}
        <button
          type="button"
          onClick={toggleStar}
          disabled={thread.busy}
          title={thread.starred ? 'Убрать из избранного' : 'Сохранить весь чат в избранное (Pro+)'}
          style={{
            position: 'absolute', top: 0, right: 0,
            width: 36, height: 36, borderRadius: 10,
            border: thread.starred ? '1px solid rgba(255,210,120,.75)' : '1px solid rgba(255,255,255,.18)',
            background: thread.starred ? 'rgba(255,210,120,.14)' : 'rgba(255,255,255,.06)',
            color: '#ffd678',
            display: 'grid', placeItems: 'center',
            boxShadow: thread.starred ? '0 6px 18px rgba(255,191,73,.25)' : 'none',
            opacity: thread.busy ? .6 : 1,
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

        {/* MINI BADGE — показываем только при активном Pro+ */}
        {proPlusActive && (
          <div style={{ display:'flex', justifyContent:'center', marginTop: 6 }}>
            <span
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'6px 10px', borderRadius: 999,
                background:'rgba(255,210,120,.16)',
                border:'1px solid rgba(255,210,120,.35)',
                boxShadow:'inset 0 0 0 1px rgba(255,255,255,.04), 0 10px 26px rgba(255,191,73,.18)',
                color:'#fff', fontWeight:700, fontSize:12, letterSpacing:.2
              }}
            >
              <span aria-hidden>✨</span>
              Pro+ активен
            </span>
          </div>
        )}
      </div>

      {/* лента сообщений */}
      <div ref={listRef} style={{ minHeight: 0, overflow: 'auto', padding: '4px 2px' }}>
        {messages.filter(m => m.role !== 'system').map((m, i) => {
          const isUser = m.role === 'user';
          const hasImages = Array.isArray(m.images) && m.images.length > 0;

          return (
            <div key={i} style={{
              margin: '10px 0',
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start'
            }}>
              <div style={{ maxWidth: '86%' }}>
                {/* текстовый пузырь */}
                {m.content && m.content !== '(изображения)' && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 14,
                      lineHeight: 1.5,
                      background: isUser ? '#24304a' : '#1a2132',
                      border: isUser ? '1px solid #2b3552' : '1px solid rgba(255,210,120,.30)',
                      boxShadow: isUser ? undefined : '0 6px 22px rgba(255,191,73,.14) inset',
                      whiteSpace: 'pre-wrap',
                      fontSize: 16,
                      wordBreak: 'break-word',
                    }}
                  >
                    {m.content}
                  </div>
                )}

                {/* «галерея» изображений ассистента */}
                {hasImages && (
                  <div
                    style={{
                      marginTop: m.content && m.content !== '(изображения)' ? 8 : 0,
                      padding: 8,
                      borderRadius: 14,
                      background: '#101622',
                      border: '1px solid #2b3552',
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gap: 8,
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      }}
                    >
                      {m.images!.map((src, idx) => (
                        <figure
                          key={idx}
                          style={{
                            margin: 0,
                            position: 'relative',
                            borderRadius: 12,
                            overflow: 'hidden',
                            border: '1px solid #2b3552',
                            background: '#0f1422',
                            aspectRatio: '1 / 1',
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            onClick={() => openLink(src)}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              cursor: 'zoom-in',
                            }}
                          />

                          {/* overlay с кнопками */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 6,
                              right: 6,
                              display: 'flex',
                              gap: 6,
                            }}
                          >
                            <a
                              href={src}
                              download
                              title="Скачать"
                              style={{
                                padding: '6px 8px',
                                borderRadius: 10,
                                background: 'rgba(0,0,0,.45)',
                                border: '1px solid rgba(255,255,255,.25)',
                                color: '#fff',
                                fontSize: 12,
                                textDecoration: 'none',
                                backdropFilter: 'blur(6px)',
                              }}
                            >
                              Скачать
                            </a>
                            <button
                              type="button"
                              onClick={() => openLink(src)}
                              title="Открыть"
                              style={{
                                padding: '6px 8px',
                                borderRadius: 10,
                                background: 'rgba(0,0,0,.45)',
                                border: '1px solid rgba(255,255,255,.25)',
                                color: '#fff',
                                fontSize: 12,
                              }}
                            >
                              Открыть
                            </button>
                          </div>
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {(loading || uploading) && (
          <div style={{ opacity: .6, fontSize: 13, padding: '6px 2px' }}>Думаю…</div>
        )}
      </div>

      {/* трей вложений (прикреплённые пользователем) */}
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
            border: '1px solid rgba(255,210,120,.28)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)',
            backdropFilter: 'saturate(160%) blur(8px)',
          }}
        >
          {attach.map(a => (
            <div key={a.id} style={{
              position: 'relative',
              width: 64, height: 64,
              borderRadius: 12,
              border: '1px solid rgba(255,210,120,.28)',
              overflow: 'hidden',
              flex: '0 0 auto',
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
                  border: '1px solid rgba(255,210,120,.35)', background: '#0e1422',
                  color: '#fff', fontSize: 16, lineHeight: '22px'
                }}
              >×</button>
              {a.status === 'uploading' && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, bottom: 0,
                  height: 5, background: 'rgba(255,210,120,.35)'
                }} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* нижняя панель */}
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
          background: 'rgba(9, 13, 22, 0.72)',
          backdropFilter: 'saturate(160%) blur(12px)',
          border: '1px solid rgba(255,210,120,.28)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,.04)',
        }}
      >
        {/* «плюс» + прозрачный input поверх */}
        <div style={{ position: 'relative', width: 40, height: 40 }}>
          <button
            type="button"
            aria-label="Прикрепить"
            disabled={pickDisabled}
            title={attach.length >= maxAttach ? `Достигнут лимит ${maxAttach} фото` : 'Прикрепить изображения'}
            style={{
              width: '100%', height: '100%', borderRadius: 10,
              border: '1px solid rgba(255,191,73,.45)', background: '#121722',
              display: 'grid', placeItems: 'center',
              fontSize: 22, lineHeight: 1,
              boxShadow: '0 8px 24px rgba(255,191,73,.14)',
              opacity: pickDisabled ? .5 : 1
            }}
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
            style={{ position: 'absolute', inset: 0, opacity: 0 }}
          />
        </div>

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
            border: '1px solid rgba(255,191,73,.45)',
            background: '#121722',
            color: 'var(--fg)',
            fontSize: 20, lineHeight: 1,
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 8px 24px rgba(255,191,73,.14)',
            opacity: (loading || uploading) || (!norm(text) && !attach.length) ? .6 : 1
          }}
        >
          ↑
        </button>
      </div>
    </main>
  );
}
