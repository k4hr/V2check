'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BackBtn from '../../../components/BackBtn';
import PROMPT from './prompt';

type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

export default function CinemaConcierge() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'system', content: PROMPT },
    { role: 'assistant', content: 'Что хотите посмотреть сегодня: фильм или сериал?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAttach, setShowAttach] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const anyFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);
  useEffect(() => { listRef.current?.scrollTo({ top: 9e9, behavior: 'smooth' }); }, [messages, loading, uploading, showAttach]);

  // пробрасываем ?id= для определения Pro на бэке
  const idSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const next = [...messages, { role: 'user', content: text } as Msg];
    setMessages(next);
    setLoading(true);

    try {
      const history = next.filter(m => m.role !== 'system').slice(-20);

      const r = await fetch('/api/assistant/ask' + idSuffix, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, history }),
      });

      const data = await r.json();

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
    }
  }

  // ===== Загрузка файлов (галерея / камера / любые) =====
  async function handleFiles(fileList: FileList | null, source: 'gallery'|'camera'|'any') {
    const file = fileList?.[0];
    if (!file) return;
    setShowAttach(false);
    setUploading(true);

    // Пишем «юзерское» сообщение с названием файла
    setMessages(m => [...m, { role: 'user', content: `📎 ${source === 'camera' ? 'Снимок' : 'Файл'}: ${file.name}` }]);

    try {
      const fd = new FormData();
      fd.append('file', file);
      // @ts-ignore
      const initData = window?.Telegram?.WebApp?.initData || '';

      const res = await fetch('/api/upload-image' + idSuffix, {
        method: 'POST',
        body: fd,
        headers: { 'X-Tg-Init-Data': initData },
      });

      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) throw new Error('Upload failed');

      const url = data?.url || '';
      const fileId = data?.fileId || '';

      // Пушим ассистентское подтверждение + превью (markdown-like)
      const confirmation =
        (url
          ? `✅ Фото загружено.\n${url}`
          : `✅ Фото загружено${fileId ? ` (id: ${fileId})` : ''}.`) +
        `\nОпишите, что на изображении важно, и я учту это в подборе.`;

      setMessages(m => [...m, { role: 'assistant', content: confirmation }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Не удалось загрузить файл. Попробуем ещё раз?' }]);
    } finally {
      setUploading(false);
      if (galleryRef.current) galleryRef.current.value = '';
      if (cameraRef.current) cameraRef.current.value = '';
      if (anyFileRef.current) anyFileRef.current.value = '';
    }
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto', display: 'grid', gap: 12 }}>
      <BackBtn fallback="/home/pro" />
      <h1 style={{ textAlign: 'center' }}>🎬 Подбор фильма/сериала</h1>
      <p style={{ textAlign: 'center', opacity: .75, marginTop: -4 }}>
        Киноконсерж задаст несколько вопросов и подберёт идеальные варианты.
      </p>

      <div
        ref={listRef}
        style={{
          border: '1px solid var(--border)',
          borderRadius: 14,
          background: '#121722',
          padding: 12,
          height: '54vh',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div key={i} style={{ margin: '10px 0', display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '82%',
                padding: '10px 12px',
                borderRadius: 12,
                lineHeight: 1.5,
                background: m.role === 'user' ? '#24304a' : '#1a2132',
                border: '1px solid #2b3552',
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {(loading || uploading) && <div style={{ opacity: .6, fontSize: 12, padding: '6px 2px' }}>
          {uploading ? 'Загрузка файла…' : 'ИИ печатает…'}
        </div>}
      </div>

      {/* ВВОД + ПЛЮСИК */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
        {/* ПЛЮСИК */}
        <button
          type="button"
          onClick={() => setShowAttach(v => !v)}
          aria-label="Прикрепить"
          style={{
            width: 42, height: 42, borderRadius: 12,
            border: '1px solid var(--border)', background: '#121722',
            display: 'grid', placeItems: 'center', fontSize: 22, lineHeight: 1
          }}
        >+</button>

        {/* МЕНЮ ПРИКРЕПЛЕНИЯ */}
        {showAttach && (
          <div
            style={{
              position: 'absolute',
              bottom: 50,
              left: 0,
              background: '#101521',
              border: '1px solid #2b3552',
              borderRadius: 14,
              padding: 10,
              width: 260,
              boxShadow: '0 12px 40px rgba(0,0,0,.5)',
              zIndex: 5
            }}
          >
            <div
              role="button"
              onClick={() => galleryRef.current?.click()}
              style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer' }}
            >🖼️ Медиатека</div>
            <div
              role="button"
              onClick={() => cameraRef.current?.click()}
              style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer' }}
            >📷 Снять фото или видео</div>
            <div
              role="button"
              onClick={() => anyFileRef.current?.click()}
              style={{ padding: '10px 12px', borderRadius: 10, cursor: 'pointer' }}
            >📁 Выбрать файлы</div>
          </div>
        )}

        {/* СКРЫТЫЕ INPUT’ы */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/*,video/*"
          multiple={false}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files, 'gallery')}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"  // намекаем открыть камеру
          multiple={false}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files, 'camera')}
        />
        <input
          ref={anyFileRef}
          type="file"
          multiple={false}
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files, 'any')}
        />

        {/* ПОЛЕ ВВОДА */}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Опишите настроение, жанры, платформу…"
          style={{
            flex: 1,
            padding: '12px 12px',
            borderRadius: 12,
            border: '1px solid var(--border)',
            background: '#121722',
            color: 'var(--fg)',
          }}
        />
        <button onClick={send} disabled={loading || !input.trim()} className="list-btn" style={{ padding: '0 16px' }}>
          Отправить
        </button>
      </div>
    </main>
  );
}
