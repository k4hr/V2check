'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BackBtn from '../../../../components/BackBtn';
import PROMPT from './prompt';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

type Attach = {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  errMsg?: string;
};

const MAX_ATTACH = 10;

export default function CinemaConcierge() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: PROMPT },
    { role: 'assistant', content: 'Что хотите посмотреть сегодня: фильм или сериал?' },
  ]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attach, setAttach] = useState<Attach[]>([]);

  const listRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' });
  }, [messages, loading, uploading, attach.length]);

  const idSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  // -------- Attachments --------
  function addFilesFromPicker(list: FileList | null) {
    const files = Array.from(list || []);
    if (!files.length) return;

    setAttach(prev => {
      const next = [...prev];
      for (const f of files) {
        if (!f.type.startsWith('image/')) continue;
        if (next.length >= MAX_ATTACH) break;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const previewUrl = URL.createObjectURL(f);
        next.push({ id, file: f, previewUrl, status: 'pending' });
      }
      return next;
    });

    // автоскролл чипсов вправо
    setTimeout(() => {
      chipsScrollRef.current?.scrollTo({ left: 9e9, behavior: 'smooth' });
    }, 0);

    if (pickerRef.current) pickerRef.current.value = '';
  }

  function removeAttach(id: string) {
    setAttach(prev => {
      const a = prev.find(x => x.id === id);
      if (a) URL.revokeObjectURL(a.previewUrl);
      return prev.filter(x => x.id !== id);
    });
  }

  // -------- Send flow --------
  async function send() {
    const t = text.trim();
    if ((!t && attach.length === 0) || loading || uploading) return;

    setLoading(true);
    setUploading(true);

    setMessages(m => [
      ...m,
      { role: 'user', content: (t || '(сообщение без текста)') + (attach.length ? `\n📎 Вложений: ${attach.length}` : '') }
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
      const history = [...messages, { role: 'user', content: promptText } as Msg]
        .filter(m => m.role !== 'system')
        .slice(-20);

      const r = await fetch('/api/assistant/ask' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, history, images: uploadedUrls }),
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
  }

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
        <BackBtn fallback="/home/pro" />
        <h1 style={{ textAlign: 'center', marginTop: 8 }}>🎬 Подбор фильма/сериала</h1>
        <p style={{ textAlign: 'center', opacity: .75, marginTop: -4 }}>
          Киноконсерж задаст несколько вопросов и подберёт идеальные варианты.
        </p>
      </div>

      {/* Лента сообщений */}
      <div ref={listRef} style={{ minHeight: 0, overflow: 'auto', padding: '4px 2px' }}>
        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div key={i} style={{
            margin: '10px 0',
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
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
            {uploading ? 'Загружаем вложения…' : 'ИИ печатает…'}
          </div>
        )}
      </div>

      {/* Нижняя панель — компактные боковые кнопки и длинный input */}
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
        {/* Плюс (40x40) */}
        <button
          type="button"
          onClick={() => pickerRef.current?.click()}
          aria-label="Прикрепить"
          disabled={attach.length >= MAX_ATTACH || uploading || loading}
          title={attach.length >= MAX_ATTACH ? 'Достигнут лимит 10 фото' : 'Прикрепить изображения'}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: '1px solid #2b3552', background: '#121722',
            display: 'grid', placeItems: 'center',
            fontSize: 22, lineHeight: 1,
            opacity: attach.length >= MAX_ATTACH ? .5 : 1
          }}
        >+</button>

        <input
          ref={pickerRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => addFilesFromPicker(e.target.files)}
        />

        {/* Средняя область: чипсы (узкая) + длинный input */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          alignItems: 'center',
          gap: 6,
          minHeight: 40
        }}>
          {/* Чипсы 32x32, максимум 90px ширины */}
          <div
            ref={chipsScrollRef}
            style={{
              maxWidth: 90,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              display: 'flex',
              gap: 4,
              padding: '2px 0'
            }}
          >
            {attach.map(a => (
              <div key={a.id} style={{
                position: 'relative',
                width: 32, height: 32,
                borderRadius: 8,
                border: '1px solid #2b3552',
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
                    width: 18, height: 18, borderRadius: 999,
                    border: '1px solid #2b3552', background: '#0e1422',
                    color: '#fff', fontSize: 11, lineHeight: '16px'
                  }}
                >×</button>
              </div>
            ))}
          </div>

          {/* Однострочный input — длинный, без переносов */}
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send(); } }}
            placeholder="Опишите настроение, жанры, платформу…"
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
        </div>

        {/* МАЛЕНЬКАЯ КНОПКА ОТПРАВКИ (40x40) со стрелкой ↑ */}
        <button
          onClick={send}
          disabled={(loading || uploading) || (!text.trim() && !attach.length)}
          aria-label="Отправить"
          title="Отправить"
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: '1px solid #2b3552',
            background: '#121722',
            color: 'var(--fg)',
            fontSize: 20,
            lineHeight: 1,
            display: 'grid',
            placeItems: 'center',
            opacity: (loading || uploading) || (!text.trim() && !attach.length) ? .6 : 1
          }}
        >
          ↑
        </button>
      </div>
    </main>
  );
}
