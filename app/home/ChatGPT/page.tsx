/* path: app/home/ChatGPT/page.tsx */
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import BackBtn from '@/components/BackBtn';
import type { Route } from 'next';
import { readLocale, applyLocaleToDocument, type Locale } from '@/lib/i18n';
import { getChatStrings } from '@/lib/i18n/ChatGPT';

export type Msg = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
};

type Attach = {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errMsg?: string;
};

const MAX_ATTACH_DEFAULT = 10;
const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';
const norm = (s: string) => (s || '').toString().trim();
const TG_INIT = () => (window as any)?.Telegram?.WebApp?.initData || '';

/** вытащить http(s)-картинки из текста (data: исключаем) */
function extractImageUrlsFromText(text: string): string[] {
  const urls = new Set<string>();
  const re = /(https?:\/\/[^\s)]+?\.(?:png|jpe?g|webp|gif))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) urls.add(m[1]);
  return Array.from(urls);
}

function openLink(url: string) {
  try {
    const tg: any = (window as any)?.Telegram?.WebApp;
    if (tg?.openLink) { tg.openLink(url); return; }
    if (tg?.openTelegramLink) { tg.openTelegramLink(url); return; }
  } catch {}
  window.open(url, '_blank', 'noopener,noreferrer');
}

function isProPlusActiveFromResp(data: any): boolean {
  const sub = data?.subscription || null;
  if (!sub?.active) return false;
  const raw = String(sub?.plan || '').toUpperCase().replace(/\s+|[_-]/g, '');
  return raw === 'PROPLUS' || raw === 'PRO+' || raw.includes('PROPLUS');
}

type ThreadState = { id?: string; starred: boolean; busy: boolean };

/* --- ответ на «какая модель/версия» --- */
function isModelVersionQuestion(raw: string, locale?: Locale): boolean {
  const s = (raw || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s\-+]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const ru =
    /(какая|какой|что за)\s+(ты\s+)?(модель|версия)/.test(s) ||
    /(какая|какой)\s+ты\s+gpt/.test(s) ||
    /(gpt|жпт|чат\s*gpt)\s*(какой|какая)?\s*(верс(ия|ии)|модель)/.test(s) ||
    /(какая|какой)\s*(у тебя|твоя)?\s*(верс(ия|ии)|модель)\s*(gpt|жпт)?/.test(s);

  const en =
    /(what|which)\s+(model|version)\s+are\s+you/.test(s) ||
    /(which|what)\s+gpt\s+(are\s+you|version|model)/.test(s) ||
    /gpt\s*(model|version)\?*$/.test(s);

  return ru || en;
}

export default function ChatGPTPage() {
  const locale: Locale = readLocale();
  const C = getChatStrings(locale); // все строки для этой страницы

  const title = C.title;
  const subtitle = C.subtitle;
  const systemPrompt = C.systemPrompt;

  const backHref = '/home' as Route;
  const maxAttach = MAX_ATTACH_DEFAULT;
  const passthroughIdParam = true;

  const TT = {
    proBadge: C.proBadge,
    uploadingFail: C.uploadingFail,
    svcDown: C.svcDown,
    gotIt: C.done,
    limit: (n: number) => C.freeLimit(n),
    starAddOnlyPro: C.favOnlyPro,
    saved: C.saved,
    saveFail: C.saveFail,
    starOnTitle: C.starOnTitle,
    starOffTitle: C.starOffTitle,
    placeholder: C.placeholder,
    download: C.download,
    open: C.open,
    thinking: C.thinking,
    hello: C.hello,
    noText: C.noText,
    attachNote: (n: number) => C.attachNote(n),
    imagesMarker: C.imagesMarker,
    imagesHeader: C.imagesHeader,
    errorShort: C.errorShort,
    attachAria: C.attachAria,
    attachTitleLimit: (max: number) => C.attachTitle(max),
    attachTitleDefault: C.attachTitleDefault,
    sendAria: C.sendAria,
    sendTitle: C.sendTitle,
  };

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: TT.hello },
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attach, setAttach] = useState<Attach[]>([]);
  const [thread, setThread] = useState<ThreadState>({ starred: false, busy: false });

  const [proPlusActive, setProPlusActive] = useState<boolean>(false);

  // Режим для сервера: proplus-* включает топовую модель
  const mode = useMemo(() => (proPlusActive ? 'proplus-chat' : 'chat'), [proPlusActive]);

  const listRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
    applyLocaleToDocument(locale);
  }, [locale]);

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

  const collectMsgsForSave = useCallback(() => {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content === TT.imagesMarker ? '' : (m.content || ''),
        images: Array.isArray(m.images) ? m.images : undefined,
      }));
  }, [messages, TT.imagesMarker]);

  const toggleStar = useCallback(async () => {
    if (thread.busy) return;
    setThread(t2 => ({ ...t2, busy: true }));

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
        const r = await fetch('/api/chat-threads' + idSuffix, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Tg-Init-Data': TG_INIT() },
          body: JSON.stringify({ toolSlug: mode || 'chat', title, starred: true }),
        });
        const data = await r.json();
        if (data?.error === 'PRO_PLUS_REQUIRED') {
          setMessages(m => [...m, { role: 'assistant', content: TT.starAddOnlyPro }]);
          setThread(s => ({ ...s, busy: false }));
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
          setMessages(m => [...m, { role: 'assistant', content: TT.starAddOnlyPro }]);
          setThread(s => ({ ...s, busy: false }));
          return;
        }
        if (!data?.ok) throw new Error(data?.error || 'PATCH_FAILED');
      }

      const payload = { threadId: tid, messages: collectMsgsForSave() };
      const r2 = await fetch('/api/chat-threads/messages' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tg-Init-Data': TG_INIT() },
        body: JSON.stringify(payload),
      });
      const data2 = await r2.json();
      if (!data2?.ok) throw new Error(data2?.error || 'SAVE_MESSAGES_FAILED');

      setThread({ id: tid, starred: true, busy: false });
      setMessages(m => [...m, { role: 'assistant', content: TT.saved }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: TT.saveFail }]);
      setThread(s => ({ ...s, busy: false }));
    }
  }, [thread, collectMsgsForSave, idSuffix, mode, title, TT]);

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
    const tText = norm(text);
    if ((!tText && attach.length === 0) || loading || uploading) return;

    setLoading(true);
    setUploading(true);

    setMessages(m => [
      ...m,
      { role: 'user', content: (tText || TT.noText) + (attach.length ? TT.attachNote(attach.length) : '') },
    ]);

    // мгновенный ответ про версию модели
    const promptText = tText || '';
    if (isModelVersionQuestion(promptText, locale)) {
      const reply = locale === 'en' ? "I’m ChatGPT 5." : "Я — ChatGPT 5.";
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
      setLoading(false);
      setUploading(false);
      setText('');
      setAttach(prev => { prev.forEach(a => URL.revokeObjectURL(a.previewUrl)); return []; });
      return;
    }

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
    } catch {
      setAttach(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        return prev.map(x => x.id === last.id ? { ...x, status: 'error', errMsg: TT.errorShort } : x);
      });
      setMessages(m => [...m, { role: 'assistant', content: TT.uploadingFail }]);
      setUploading(false);
      setLoading(false);
      return;
    }

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

        const serverImages: string[] = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
        const fromText = extractImageUrlsFromText(reply);
        const uniqueImages = Array.from(new Set([...(serverImages || []), ...(fromText || [])]));

        if (reply.replace(/\s+/g, '').length) {
          setMessages(m => [...m, { role: 'assistant', content: reply }]);
        }
        if (uniqueImages.length) {
          setMessages(m => [...m, { role: 'assistant', content: TT.imagesMarker, images: uniqueImages }]);
        }
        if (!reply && !uniqueImages.length) {
          setMessages(m => [...m, { role: 'assistant', content: TT.gotIt }]);
        }
      } else if (data?.error === 'FREE_LIMIT_REACHED' || data?.error === 'DAILY_LIMIT_REACHED') {
        const msg = TT.limit(Number(data?.freeLimit ?? data?.limit ?? 0));
        setMessages(m => [...m, { role: 'assistant', content: msg }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: TT.svcDown }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: TT.svcDown }]);
    } finally {
      setLoading(false);
      setUploading(false);
      setText('');
      setAttach(prev => { prev.forEach(a => URL.revokeObjectURL(a.previewUrl)); return []; });
    }
  }, [attach, idSuffix, loading, mode, systemPrompt, text, uploading, messages, TT, locale]);

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
        <button
          type="button"
          onClick={toggleStar}
          disabled={thread.busy}
          title={thread.starred ? TT.starOnTitle : TT.starOffTitle}
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

        {proPlusActive && (
          <div style={{ display:'flex', justifyContent:'center', marginTop: 6 }}>
            <span
              style={{
                display:'inline-flex', alignItems:'center', gap:8,
                padding:'6px 12px', borderRadius: 999,
                // стекло + золотой блик
                background: 'linear-gradient(135deg, rgba(255,210,120,.20), rgba(255,210,120,.10)), rgba(255,255,255,.72)',
                border:'1px solid rgba(255,210,120,.45)',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,.55), 0 10px 26px rgba(255,191,73,.18)',
                backdropFilter:'blur(10px) saturate(140%)',
                color:'#0B0C10', fontWeight:700, fontSize:12, letterSpacing:.2
              }}
            >
              ✨ {TT.proBadge}
            </span>
          </div>
        )}
      </div>

      <div ref={listRef} style={{ minHeight: 0, overflow: 'auto', padding: '4px 2px' }}>
        {messages.filter(m => m.role !== 'system').map((m, i) => {
          const isUser = m.role === 'user';
          const isAssistant = m.role === 'assistant';
          const hasImages = Array.isArray(m.images) && m.images.length > 0;

          // ---- ЕДИНЫЙ стиль стеклянных пузырей ----
          const bubbleBase: React.CSSProperties = {
            padding: '10px 12px',
            borderRadius: 14,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
            fontSize: 16,
            wordBreak: 'break-word',
            color: 'var(--text)',
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
              justifyContent: isUser ? 'flex-end' : 'flex-start'
            }}>
              <div style={{ maxWidth: '86%' }}>
                {m.content && m.content !== TT.imagesMarker && (
                  <div style={bubbleStyle}>
                    {m.content}
                  </div>
                )}

                {hasImages && (
                  <div
                    style={{
                      marginTop: m.content && m.content !== TT.imagesMarker ? 8 : 0,
                      padding: 8,
                      borderRadius: 14,
                      background: 'rgba(255,255,255,.78)',
                      border: '1px solid rgba(10,12,20,.10)',
                      backdropFilter: 'saturate(140%) blur(10px)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.55), 0 8px 24px rgba(18,28,45,.08)',
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
                            border: '1px solid rgba(10,12,20,.10)',
                            background: 'rgba(255,255,255,.75)',
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
                              title={TT.download}
                              style={{
                                padding: '6px 8px',
                                borderRadius: 10,
                                background: 'rgba(255,255,255,.85)',
                                border: '1px solid rgba(10,12,20,.10)',
                                color: 'var(--text)',
                                fontSize: 12,
                                textDecoration: 'none',
                                backdropFilter: 'blur(6px)',
                              }}
                            >
                              {TT.download}
                            </a>
                            <button
                              type="button"
                              onClick={() => openLink(src)}
                              title={TT.open}
                              style={{
                                padding: '6px 8px',
                                borderRadius: 10,
                                background: 'rgba(255,255,255,.85)',
                                border: '1px solid rgba(10,12,20,.10)',
                                color: 'var(--text)',
                                fontSize: 12,
                              }}
                            >
                              {TT.open}
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
          <div style={{ opacity: .6, fontSize: 13, padding: '6px 2px' }}>{TT.thinking}</div>
        )}
      </div>

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
                aria-label={TT.attachAria}
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

      {/* НИЖНЯЯ ПАНЕЛЬ — универсальный композер */}
      <div className="lm-composer">
        {/* Плюс + прозрачный file-input поверх */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            aria-label={TT.attachAria}
            disabled={pickDisabled}
            title={attach.length >= maxAttach ? TT.attachTitleLimit(maxAttach) : TT.attachTitleDefault}
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
            placeholder={TT.placeholder}
            type="text"
          />
        </div>

        {/* Кнопка отправки */}
        <button
          onClick={send}
          disabled={(loading || uploading) || (!norm(text) && !attach.length)}
          aria-label={TT.sendAria}
          title={TT.sendTitle}
          className="lm-composer__btn"
          style={{ opacity: (loading || uploading) || (!norm(text) && !attach.length) ? .6 : 1 }}
        >
          ↑
        </button>
      </div>
    </main>
  );
}
