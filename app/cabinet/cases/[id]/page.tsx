'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

type CaseItem = {
  id: string;
  kind: 'note' | 'step' | 'deadline' | 'doc' | string;
  title: string;
  body?: string | null;
  dueAt?: string | null;
  done: boolean;
  priority?: number | null;
  createdAt: string;
};

type CaseData = {
  id: string;
  title: string;
  status: string;           // active | closed | archived
  createdAt: string;
  updatedAt: string;
  nextDueAt?: string | null;
  items?: CaseItem[];
};

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

function getDebugIdFromUrl(): string | null {
  try {
    const u = new URL(window.location.href);
    const id = u.searchParams.get('id');
    if (id && /^\d{3,15}$/.test(id)) return id;
  } catch {}
  return null;
}

export default function CasePage() {
  const params = useParams();
  const router = useRouter();
  const caseId = String(params?.id || '');

  const [userInitData, setUserInitData] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<CaseData | null>(null);
  const [items, setItems] = useState<CaseItem[]>([]);

  const [newKind, setNewKind] = useState<'note' | 'step' | 'deadline' | 'doc'>('note');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newBody, setNewBody] = useState<string>('');
  const [newDue, setNewDue] = useState<string>(''); // 'YYYY-MM-DD'

  // initData из TWA (если есть)
  useEffect(() => {
    const WebApp: any = (window as any)?.Telegram?.WebApp;
    try { WebApp?.ready?.(); WebApp?.expand?.(); } catch {}
    const initData = WebApp?.initData || '';
    if (initData) setUserInitData(initData);
  }, []);

  // если нет initData — используем ?id=... (дебаг)
  const apiSuffix = useMemo(() => {
    if (userInitData) return '';
    if (DEBUG) {
      const dbg = getDebugIdFromUrl();
      if (dbg) return `?id=${encodeURIComponent(dbg)}`;
    }
    return '';
  }, [userInitData]);

  const apiHeaders = useMemo<Record<string, string>>(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (userInitData) h['x-init-data'] = userInitData;
    return h;
  }, [userInitData]);

  async function loadAll() {
    if (!caseId) return;
    setLoading(true);
    setError(null);
    try {
      const r1 = await fetch(`/api/cases/${caseId}${apiSuffix}`, { method: 'GET', headers: apiHeaders });
      const d1 = await r1.json();
      if (!r1.ok || !d1?.ok) throw new Error(d1?.error || `HTTP_${r1.status}`);
      setData(d1.case as CaseData);

      const r2 = await fetch(`/api/cases/${caseId}/items${apiSuffix}`, { method: 'GET', headers: apiHeaders });
      const d2 = await r2.json();
      if (!r2.ok || !d2?.ok) throw new Error(d2?.error || `HTTP_${r2.status}`);
      setItems((d2.items || []) as CaseItem[]);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, apiSuffix, apiHeaders]);

  async function addItem() {
    if (!newTitle.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body: any = { kind: newKind, title: newTitle.trim() };
      if (newBody.trim()) body.body = newBody.trim();
      if (newKind === 'deadline' && newDue) {
        body.dueAt = new Date(`${newDue}T00:00:00`).toISOString();
      }
      const r = await fetch(`/api/cases/${caseId}/items${apiSuffix}`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || `HTTP_${r.status}`);

      setItems((prev) => [d.item as CaseItem, ...prev]);
      setNewTitle(''); setNewBody(''); setNewDue(''); setNewKind('note');
    } catch (e: any) {
      setError(e?.message || 'Не удалось добавить элемент');
    } finally {
      setSaving(false);
    }
  }

  function fmt(d?: string | null): string {
    if (!d) return '';
    const x = new Date(d);
    const dd = String(x.getDate()).padStart(2, '0');
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    const yyyy = x.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  const linkSuffix = apiSuffix;

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ textAlign: 'center' }}>Дело</h1>

      <div style={{ marginTop: 8 }}>
        <button onClick={() => router.back()} className="list-btn" style={{ textDecoration: 'none', padding: '8px 12px', borderRadius: 10 }}>
          ← Назад
        </button>
        <Link href={`/cabinet/cases${linkSuffix}`} className="list-btn" style={{ textDecoration: 'none', marginLeft: 8, padding: '8px 12px', borderRadius: 10 }}>
          В кабинет
        </Link>
      </div>

      <div style={{ marginTop: 12, border: '1px solid #333', borderRadius: 12, padding: 12, maxWidth: 820, marginInline: 'auto' }}>
        {loading && <p style={{ opacity: .7 }}>Загружаем…</p>}
        {error && <p style={{ color: 'tomato' }}>Ошибка: {error}</p>}

        {data && (
          <>
            <h3 style={{ margin: '8px 0' }}>{data.title}</h3>
            <p style={{ margin: '6px 0', opacity: .85 }}>
              Статус: <b>{data.status}</b>
              {data.nextDueAt ? <> · Ближайший срок: <b>{fmt(data.nextDueAt)}</b></> : null}
            </p>
            <p style={{ margin: '6px 0', opacity: .7 }}>
              Создано: {fmt(data.createdAt)} · Обновлено: {fmt(data.updatedAt)}
            </p>
          </>
        )}
      </div>

      {/* Добавить элемент таймлайна */}
      <div style={{ marginTop: 12, border: '1px solid #333', borderRadius: 12, padding: 12, maxWidth: 820, marginInline: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Добавить этап/заметку</h3>

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={newKind} onChange={(e) => setNewKind(e.target.value as any)}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }}>
              <option value="note">Заметка</option>
              <option value="step">Шаг</option>
              <option value="deadline">Срок/дедлайн</option>
              <option value="doc">Документ</option>
            </select>

            {newKind === 'deadline' && (
              <input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }}
              />
            )}
          </div>

          <input
            placeholder="Заголовок"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit' }}
          />

          <textarea
            placeholder="Описание (необязательно)"
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            rows={3}
            style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border, #333)', background: 'transparent', color: 'inherit', resize: 'vertical' }}
          />

          <div>
            <button
              disabled={saving || !newTitle.trim()}
              onClick={addItem}
              className="list-btn"
              style={{ padding: '8px 12px', borderRadius: 10 }}
            >
              {saving ? 'Сохраняем…' : 'Добавить'}
            </button>
          </div>
        </div>
      </div>

      {/* Таймлайн */}
      <div style={{ marginTop: 12, border: '1px solid #333', borderRadius: 12, padding: 12, maxWidth: 820, marginInline: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>Таймлайн</h3>

        {!items.length && <p style={{ opacity: .7 }}>Пока нет записей.</p>}

        <div style={{ display: 'grid', gap: 8 }}>
          {items.map((it) => (
            <div key={it.id} className="list-btn" style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {it.title}
                    {' '}
                    <span style={{ opacity: .6, fontWeight: 400 }}>
                      · {it.kind === 'deadline' ? 'Срок' : it.kind === 'step' ? 'Шаг' : it.kind === 'doc' ? 'Документ' : 'Заметка'}
                    </span>
                  </div>
                  {it.body ? <div style={{ opacity: .85, whiteSpace: 'pre-wrap', marginTop: 4 }}>{it.body}</div> : null}
                </div>
                <div style={{ textAlign: 'right', minWidth: 120, opacity: .7 }}>
                  {it.dueAt ? <>до {fmt(it.dueAt)}<br/></> : null}
                  <span style={{ fontSize: 12 }}>создано {fmt(it.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
