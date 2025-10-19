/* path: app/home/ChatGPT/page.tsx */
'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import BackBtn from '@/components/BackBtn';
import type { Route } from 'next';
import { readLocale, applyLocaleToDocument, t } from '@/lib/i18n';

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string; images?: string[] };
type Attach = { id: string; file: File; previewUrl: string; uploadedUrl?: string; status: 'pending'|'uploading'|'done'|'error'; errMsg?: string };

const MAX_ATTACH_DEFAULT = 10;
const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';
const norm = (s: string) => (s || '').toString().trim();
const TG_INIT = () => (window as any)?.Telegram?.WebApp?.initData || '';

// helpers
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

export default function ChatGPTPage() {
  const locale = readLocale();

  // тексты
  const title = t(locale, 'chatTitle', 'CHATGPT 5');
  const subtitle = t(locale, 'chatSubtitle', 'Свободное общение. Спросите что угодно.');
  const systemPrompt = t(locale, 'chatSystemPrompt', 'Ты дружелюбный ассистент. Пиши по делу и без Markdown.');

  const tProBadge        = t(locale, 'chatProBadge');
  const tUploadingFail   = t(locale, 'chatUploadFail');
  const tSvcDown         = t(locale, 'chatSvcDown');
  const tGotIt           = t(locale, 'chatDone');
  const tLimit           = (n:number)=> (t(locale,'chatFreeLimit') as (n:number)=>string)(n);
  const tStarOnlyPro     = t(locale, 'chatFavOnlyPro');
  const tSaved           = t(locale, 'chatSaved');
  const tSaveFail        = t(locale, 'chatSaveFail');
  const tStarOnTitle     = t(locale, 'chatFavRemove');
  const tStarOffTitle    = t(locale, 'chatFavAdd');
  const tPlaceholder     = t(locale, 'chatPlaceholder');
  const tDownload        = t(locale, 'chatDownload');
  const tOpen            = t(locale, 'chatOpen');
  const tThinking        = t(locale, 'chatThinking');
  const tHello           = t(locale, 'chatHello');
  const tNoText          = t(locale, 'chatNoText');
  const tAttachNote      = (n:number)=> (t(locale,'chatAttachNote') as (n:number)=>string)(n);
  const tImagesMarker    = t(locale, 'chatImagesMarker');
  const tImagesHeader    = t(locale, 'chatImagesHeader');
  const tErrShort        = t(locale, 'chatErrorShort');
  const tAttachAria      = t(locale, 'chatAttachAria');
  const tAttachTitle     = (atLimit:boolean, max=MAX_ATTACH_DEFAULT) =>
    atLimit ? (t(locale,'chatAttachTitle') as (m:number)=>string)(max) : t(locale,'chatAttachTitleDefault');
  const tSendAria        = t(locale, 'chatSendAria');
  const tSendTitle       = t(locale, 'chatSendTitle');

  const mode = 'chat';
  const backHref = '/home' as Route;
  const maxAttach = MAX_ATTACH_DEFAULT;
  const passthroughIdParam = true;

  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: systemPrompt },
    { role: 'assistant', content: tHello },
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

  // Telegram + lang/dir
  useEffect(() => {
    try { (window as any)?.Telegram?.WebApp?.ready?.(); (window as any)?.Telegram?.WebApp?.expand?.(); } catch {}
    applyLocaleToDocument(locale);
  }, [locale]);

  // автоскролл
  useEffect(() => { listRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }); }, [messages, loading, uploading]);
  useEffect(() => { if (attach.length) trayRef.current?.scrollTo({ left: 9e9, behavior: 'smooth' }); }, [attach.length]);

  // id passthrough
  const idSuffix = useMemo(() => {
    if (!passthroughIdParam) return '';
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, [passthroughIdParam]);

  // статус подписки -> бейдж
  useEffect(() => {
    (async () => {
      try {
        let endpoint = '/api/me';
        const headers: Record<string, string> = {};
        const init = TG_INIT();
        if (init) headers['x-init-data'] = init;
        else if (DEBUG && idSuffix) endpoint += idSuffix;
        const r = await fetch(endpoint, { method: 'POST', headers, cache:'no-store' });
        const data = await r.json().catch(() => ({}));
        setProPlusActive(isProPlusActiveFromResp(data));
      } catch { setProPlusActive(false); }
    })();
  }, [idSuffix]);

  // автозагрузка треда
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const tid = u.searchParams.get('thread');
      if (!tid) return;
      (async () => {
        try {
          const r = await fetch(`/api/chat-threads?id=${encodeURIComponent(tid)}`, { headers: { 'X-Tg-Init-Data': TG_INIT() } });
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

  // подготовка к сохранению
  const collectMsgsForSave = useCallback(() => {
    return messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role,
        content: m.content === tImagesMarker ? '' : (m.content || ''),
        images: Array.isArray(m.images) ? m.images : undefined,
      }));
  }, [messages, tImagesMarker]);

  // избранное
  const toggleStar = useCallback(async () => {
    if (thread.busy) return;
    setThread(s => ({ ...s, busy: true }));
    try {
      if (thread.id && thread.starred) {
        const r = await fetch('/api/chat-threads', {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', 'X-Tg-Init-Data': TG_INIT() },
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
          headers: { 'Content-Type':'application/json', 'X-Tg-Init-Data': TG_INIT() },
          body: JSON.stringify({ toolSlug: 'chat', title, starred: true }),
        });
        const data = await r.json();
        if (data?.error === 'PRO_PLUS_REQUIRED') {
          setMessages(m => [...m, { role: 'assistant', content: tStarOnlyPro }]); setThread(s => ({ ...s, busy: false })); return;
        }
        if (!data?.ok || !data.thread?.id) throw new Error(data?.error || 'CREATE_FAILED');
        tid = String(data.thread.id);
      } else {
        const r = await fetch('/api/chat-threads', {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', 'X-Tg-Init-Data': TG_INIT() },
          body: JSON.stringify({ id: tid, starred: true }),
        });
        const data = await r.json();
        if (data?.error === 'PRO_PLUS_REQUIRED') {
          setMessages(m => [...m, { role: 'assistant', content: tStarOnlyPro }]); setThread(s => ({ ...s, busy: false })); return;
        }
        if (!data?.ok) throw new Error(data?.error || 'PATCH_FAILED');
      }
      const payload = { threadId: tid, messages: collectMsgsForSave() };
      const r2 = await fetch('/api/chat-threads/messages' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'X-Tg-Init-Data': TG_INIT() },
        body: JSON.stringify(payload),
      });
      const data2 = await r2.json();
      if (!data2?.ok) throw new Error(data2?.error || 'SAVE_MESSAGES_FAILED');

      setThread({ id: tid, starred: true, busy: false });
      setMessages(m => [...m, { role: 'assistant', content: tSaved }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: tSaveFail }]);
      setThread(s => ({ ...s, busy: false }));
    }
  }, [thread, collectMsgsForSave, idSuffix, title, tStarOnlyPro, tSaved, tSaveFail]);

  // отправка
  const addFilesFromPicker = useCallback((list: FileList | null) => {
    const files = Array.from(list || []);
    if (!files.length) return;
    setAttach(prev => {
      const next = [...prev];
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue;
        if (next.length >= MAX_ATTACH_DEFAULT) break;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const previewUrl = URL.createObjectURL(f);
        next.push({ id, file: f, previewUrl, status: 'pending' });
      }
      return next;
    });
    if (pickerRef.current) pickerRef.current.value = '';
  }, []);

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

    setMessages(m => [...m, { role: 'user', content: (tText || tNoText) + (attach.length ? tAttachNote(attach.length) : '') }]);

    const uploadedUrls: string[] = [];
    try {
      for (let i = 0; i < attach.length; i++) {
        const it = attach[i];
        setAttach(prev => prev.map(x => (x.id === it.id ? { ...x, status: 'uploading' } : x)));
        const fd = new FormData(); fd.append('file', it.file);
        const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 60_000);
        let res: Response; try {
          res = await fetch('/api/upload-image' + idSuffix, { method:'POST', body: fd, headers:{'X-Tg-Init-Data': TG_INIT()}, signal: ctrl.signal });
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
        return prev.map(x => x.id === last.id ? { ...x, status: 'error', errMsg: tErrShort } : x);
      });
      setMessages(m => [...m, { role: 'assistant', content: tUploadingFail }]);
      setUploading(false); setLoading(false);
      return;
    }

    const imagesNote = uploadedUrls.length ? `\n\n${tImagesHeader}\n${uploadedUrls.map(u => `- ${u}`).join('\n')}` : '';
    const promptText = (tText || '') + imagesNote;

    try {
      const history = [
        { role: 'system', content: systemPrompt },
        ...messages.filter(m => m.role !== 'system'),
        { role: 'user', content: promptText } as Msg,
      ].slice(-20) as Msg[];

      const r = await fetch('/api/assistant/ask' + idSuffix, {
        method: 'POST', headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ prompt: promptText, history, images: uploadedUrls, mode }),
      });

      const data = await r.json().catch(() => ({} as any));
      if (data?.ok) {
        const reply = String(data.answer || '').trim();
        const serverImages: string[] = Array.isArray(data.images) ? data.images.filter(Boolean) : [];
        const fromText = extractImageUrlsFromText(reply);
        const uniqueImages = Array.from(new Set([...(serverImages || []), ...(fromText || [])]));

        if (reply.replace(/\s+/g, '').length) setMessages(m => [...m, { role: 'assistant', content: reply }]);
        if (uniqueImages.length) setMessages(m => [...m, { role: 'assistant', content: tImagesMarker, images: uniqueImages }]);
        if (!reply && !uniqueImages.length) setMessages(m => [...m, { role: 'assistant', content: tGotIt }]);
      } else if (data?.error === 'FREE_LIMIT_REACHED') {
        setMessages(m => [...m, { role: 'assistant', content: tLimit(Number(data?.freeLimit ?? 0)) }]);
      } else {
        setMessages(m => [...m, { role: 'assistant', content: tSvcDown }]);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: tSvcDown }]);
    } finally {
      setLoading(false); setUploading(false); setText('');
      setAttach(prev => { prev.forEach(a => URL.revokeObjectURL(a.previewUrl)); return []; });
    }
  }, [attach, idSuffix, loading, uploading, messages, systemPrompt, tNoText, tAttachNote, tImagesHeader, tImagesMarker, tGotIt, tLimit, tSvcDown, tUploadingFail, tErrShort, text]);

  const pickDisabled = attach.length >= MAX_ATTACH_DEFAULT || uploading || loading;

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 12, padding: '12px 12px calc(12px + env(safe-area-inset-bottom))' }}>
      <div style={{ position: 'relative' }}>
        <BackBtn fallback={backHref} />
        {/* ★ */}
        <button
          type="button"
          onClick={toggleStar}
          disabled={thread.busy}
          title={thread.starred ? tStarOnTitle : tStarOffTitle}
          style={{
            position: 'absolute', top: 0, right: 0, width: 36, height: 36, borderRadius: 10,
            border: thread.starred ? '1px solid rgba(255,210,120,.75)' : '1px solid rgba(255,255,255,.18)',
            background: thread.starred ? 'rgba(255,210,120,.14)' : 'rgba(255,255,255,.06)',
            color: '#ffd678', display: 'grid', placeItems: 'center',
            boxShadow: thread.starred ? '0 6px 18px rgba(255,191,73,.25)' : 'none', opacity: thread.busy ? .6 : 1,
          }}
        >
          {thread.starred ? '★' : '☆'}
        </button>

        <h1 style={{ textAlign: 'center', marginTop: 8, fontSize: 22, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </h1>
        {!!subtitle && (<p style={{ textAlign: 'center', opacity: .75, marginTop: -4 }}>{subtitle}</p>)}

        {proPlusActive && (
          <div style={{ display:'flex', justifyContent:'center', marginTop: 6 }}>
            <span style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius: 999,
              background:'rgba(255,210,120,.16)', border:'1px solid rgba(255,210,120,.35)',
              boxShadow:'inset 0 0 0 1px rgba(255,255,255,.04), 0 10px 26px rgba(255,191,73,.18)',
              color:'#fff', fontWeight:700, fontSize:12, letterSpacing:.2
            }}>
              <span aria-hidden>✨</span>{tProBadge}
            </span>
          </div>
        )}
      </div>

      {/* лента */}
      <div ref={listRef} style={{ minHeight: 0, overflow: 'auto', padding: '4px 2px' }}>
        {messages.filter(m => m.role !== 'system').map((m, i) => {
          const isUser = m.role === 'user';
          const hasImages = Array.isArray(m.images) && m.images.length > 0;
          return (
            <div key={i} style={{ margin: '10px 0', display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '86%' }}>
                {m.content && m.content !== tImagesMarker && (
                  <div style={{
                    padding: '10px 12px', borderRadius: 14, lineHeight: 1.5,
                    background: isUser ? '#24304a' : '#1a2132',
                    border: isUser ? '1px solid #2b3552' : '1px solid rgba(255,210,120,.30)',
                    boxShadow: isUser ? undefined : '0 6px 22px rgba(255,191,73,.14) inset',
                    whiteSpace: 'pre-wrap', fontSize: 16, wordBreak: 'break-word',
                  }}>
                    {m.content}
                  </div>
                )}
                {hasImages && (
                  <div style={{ marginTop: m.content && m.content !== tImagesMarker ? 8 : 0, padding: 8, borderRadius: 14, background: '#101622', border: '1px solid #2b3552' }}>
                    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                      {m.images!.map((src, idx) => (
                        <figure key={idx} style={{ margin: 0, position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid #2b3552', background: '#0f1422', aspectRatio: '1 / 1' }}>
                          <img src={src} alt="" onClick={() => openLink(src)} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', cursor:'zoom-in' }} />
                          <div style={{ position:'absolute', bottom:6, right:6, display:'flex', gap:6 }}>
                            <a href={src} download title={tDownload} style={{ padding:'6px 8px', borderRadius:10, background:'rgba(0,0,0,.45)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:12, textDecoration:'none', backdropFilter:'blur(6px)' }}>
                              {tDownload}
                            </a>
                            <button type="button" onClick={() => openLink(src)} title={tOpen} style={{ padding:'6px 8px', borderRadius:10, background:'rgba(0,0,0,.45)', border:'1px solid rgba(255,255,255,.25)', color:'#fff', fontSize:12 }}>
                              {tOpen}
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
        {(loading || uploading) && (<div style={{ opacity:.6, fontSize:13, padding:'6px 2px' }}>{tThinking}</div>)}
      </div>

      {/* трей вложений */}
      {!!attach.length && (
        <div ref={trayRef} style={{ overflowX:'auto', display:'flex', gap:10, padding:'8px 4px', borderRadius:14, background:'rgba(9, 13, 22, 0.6)', border:'1px solid rgba(255,210,120,.28)', boxShadow:'inset 0 0 0 1px rgba(255,255,255,.04)', backdropFilter:'saturate(160%) blur(8px)' }}>
          {attach.map(a => (
            <div key={a.id} style={{ position:'relative', width:64, height:64, borderRadius:12, border:'1px solid rgba(255,210,120,.28)', overflow:'hidden', flex:'0 0 auto' }}>
              <img src={a.previewUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              <button type="button" aria-label={tAttachAria} onClick={() => removeAttach(a.id)}
                style={{ position:'absolute', top:-6, right:-6, width:26, height:26, borderRadius:999, border:'1px solid rgba(255,210,120,.35)', background:'#0e1422', color:'#fff', fontSize:16, lineHeight:'22px' }}>
                ×
              </button>
              {a.status === 'uploading' && (<div style={{ position:'absolute', left:0, right:0, bottom:0, height:5, background:'rgba(255,210,120,.35)' }} />)}
            </div>
          ))}
        </div>
      )}

      {/* нижняя панель */}
      <div style={{ position:'sticky', bottom:0, display:'grid', gridTemplateColumns:'auto 1fr auto', gap:6, alignItems:'center', padding:8, borderRadius:16, background:'rgba(9, 13, 22, 0.72)', backdropFilter:'saturate(160%) blur(12px)', border:'1px solid rgba(255,210,120,.28)', boxShadow:'0 10px 30px rgba(0,0,0,0.35), inset 0 0 0 1px rgba(255,255,255,.04)' }}>
        <div style={{ position:'relative', width:40, height:40 }}>
          <button type="button" aria-label={tAttachAria} disabled={pickDisabled} title={tAttachTitle(attach.length >= MAX_ATTACH_DEFAULT)}
            style={{ width:'100%', height:'100%', borderRadius:10, border:'1px solid rgba(255,191,73,.45)', background:'#121722', display:'grid', placeItems:'center', fontSize:22, lineHeight:1, boxShadow:'0 8px 24px rgba(255,191,73,.14)', opacity: pickDisabled ? .5 : 1 }}>
            +
          </button>
          <input ref={pickerRef} type="file" accept="image/*" multiple disabled={pickDisabled} onChange={(e)=>addFilesFromPicker(e.target.files)} style={{ position:'absolute', inset:0, opacity:0 }} />
        </div>

        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
          placeholder={tPlaceholder}
          style={{ height:40, padding:'0 12px', borderRadius:12, border:'1px solid #2b3552', background:'#121722', color:'var(--fg)', fontSize:16, outline:'none', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}
        />

        <button onClick={send} disabled={(loading || uploading) || (!norm(text) && !attach.length)} aria-label={tSendAria} title={tSendTitle}
          style={{ width:40, height:40, borderRadius:10, border:'1px solid rgba(255,191,73,.45)', background:'#121722', color:'var(--fg)', fontSize:20, lineHeight:1, display:'grid', placeItems:'center', boxShadow:'0 8px 24px rgba(255,191,73,.14)', opacity: (loading || uploading) || (!norm(text) && !attach.length) ? .6 : 1 }}>
          ↑
        </button>
      </div>
    </main>
  );
}
