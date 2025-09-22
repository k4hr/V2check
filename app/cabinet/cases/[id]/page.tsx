'use client';

import { useEffect, useMemo, useState } from 'react';

type CaseItem = {
  id: string;
  kind: 'note'|'step'|'deadline'|'doc';
  title: string;
  body?: string | null;
  dueAt?: string | null;
  done?: boolean;
  priority?: number | null;
  createdAt: string;
};

type CaseData = {
  id: string;
  title: string;
  status: string;
  nextDueAt?: string | null;
  items: CaseItem[];
};

const FIELD_STYLE: React.CSSProperties = {
  padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
  background: 'transparent', color: 'inherit', outline: 'none', fontSize: 14
};

export default function CasePage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [data, setData] = useState<CaseData | null>(null);

  const [kind, setKind] = useState<'note'|'step'|'deadline'|'doc'>('note');
  const [title, setTitle] = useState('');
  const [body, setBody]   = useState('');
  const [dueAt, setDueAt] = useState<string>('');
  const [priority, setPriority] = useState<number|''>('');

  const [loading, setLoading] = useState(false);

  const tgId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const u = new URL(window.location.href);
    return u.searchParams.get('id') || '';
  }, []);

  async function load() {
    setLoading(true);
    try {
      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;
      const res = await fetch(`/api/cases/${id}${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        headers: { ...(initData ? { 'x-init-data': initData } : {}) },
        cache: 'no-store',
      });
      const js = await res.json();
      if (js?.ok) setData(js.item);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function addItem() {
    const payload: any = { kind, title: title.trim() };
    if (body.trim()) payload.body = body.trim();
    if (priority !== '') payload.priority = Number(priority);
    if (kind === 'deadline' && dueAt) payload.dueAt = new Date(dueAt).toISOString();

    if (!payload.title) return;

    setLoading(true);
    try {
      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;
      const res = await fetch(`/api/cases/${id}/items${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
        body: JSON.stringify(payload),
      });
      const js = await res.json();
      if (js?.ok) {
        setTitle(''); setBody(''); setDueAt(''); setPriority('');
        await load();
      }
    } finally { setLoading(false); }
  }

  return (
    <main style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center' }}>{data?.title || 'Дело'}</h1>

      <div style={{ marginTop: 8 }}>
        <a href={`/cabinet/cases${tgId ? `?id=${encodeURIComponent(tgId)}` : ''}`} className="list-btn" style={{ textDecoration: 'none', maxWidth: 140 }}>
          ← Назад
        </a>
      </div>

      {/* Таймлайн */}
      <div style={{
        marginTop: 12, borderRadius: 12, border: '1px solid var(--border)',
        background: 'var(--panel)', display: 'flex', flexDirection: 'column', minHeight: '50vh'
      }}>
        <div style={{ padding: 12 }}>
          {data?.items?.length ? data.items.map(it => (
            <div key={it.id} style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 12, opacity: .7, marginBottom: 4 }}>
                {new Date(it.createdAt).toLocaleString()} • {it.kind === 'deadline' ? 'Дедлайн' : it.kind === 'step' ? 'Шаг' : it.kind === 'doc' ? 'Документ' : 'Заметка'}
                {it.priority ? ` • приоритет ${it.priority}` : ''}
                {it.dueAt ? ` • срок ${new Date(it.dueAt).toLocaleDateString()}` : ''}
              </div>
              <div style={{ fontWeight: 600 }}>{it.title}</div>
              {it.body ? <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{it.body}</div> : null}
            </div>
          )) : <div style={{ opacity: .7 }}>Пока нет записей.</div>}
        </div>

        {/* форма добавления элемента */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select value={kind} onChange={(e) => setKind(e.target.value as any)} style={{ ...FIELD_STYLE }}>
                <option value="note">Заметка</option>
                <option value="step">Шаг</option>
                <option value="deadline">Дедлайн</option>
                <option value="doc">Документ</option>
              </select>
              {kind === 'deadline' ? (
                <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={{ ...FIELD_STYLE }} />
              ) : null}
              <select value={String(priority)} onChange={(e)=> setPriority(e.target.value === '' ? '' : Number(e.target.value))} style={{ ...FIELD_STYLE, width: 140 }}>
                <option value="">Приоритет</option>
                <option value="1">1 (высокий)</option>
                <option value="2">2</option>
                <option value="3">3 (низкий)</option>
              </select>
            </div>
            <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Заголовок…" style={{ ...FIELD_STYLE }} />
            <textarea value={body} onChange={(e)=>setBody(e.target.value)} placeholder="Описание/шаги/заметка…" rows={3} style={{ ...FIELD_STYLE, resize: 'vertical' }} />
            <div>
              <button className="list-btn" onClick={addItem} disabled={loading || !title.trim()} style={{ padding: '0 16px' }}>Добавить</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
