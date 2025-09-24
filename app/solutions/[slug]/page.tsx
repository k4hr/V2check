// app/solutions/[slug]/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ALL_TEMPLATES, getTemplateBody, TemplateStep } from '../templates';

export default function SolutionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const t = useMemo(() => ALL_TEMPLATES.find(x => x.slug === slug), [slug]);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string| null>(null);
  const [err, setErr] = useState<string| null>(null);

  if (!t) {
    return (
      <main style={{ padding:20 }}>
        <h1>Не найдено</h1>
        <p>Запрошенное решение отсутствует.</p>
        <button onClick={() => router.back()} className="list-btn" style={{ marginTop:8 }}>← Назад</button>
      </main>
    );
  }

  const body = getTemplateBody(t.slug, t.title);

  async function createCaseFromTemplate() {
    setSaving(true); setErr(null); setMsg(null);
    try {
      const w: any = window;
      const initData: string | undefined = w?.Telegram?.WebApp?.initData;

      // 1) создаём дело
      const r1 = await fetch(`/api/cases/auto-create`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
        body: JSON.stringify({
          title: t.title,
          answer: body, // положим текст справки как заметку
          qa: []        // сюда можно прокидывать ответы пользователя, если появятся
        }),
      });
      const d1 = await r1.json();
      if (!r1.ok || !d1?.ok || !d1?.caseId) throw new Error(d1?.error || 'CASE_CREATE_FAILED');

      const caseId: string = d1.caseId;

      // 2) если есть предложенные шаги — создадим элементы таймлайна
      async function postItem(step: TemplateStep) {
        const dueAt = typeof step.dueInDays === 'number'
          ? new Date(Date.now() + step.dueInDays * 24*60*60*1000).toISOString()
          : undefined;
        await fetch(`/api/cases/${caseId}/items`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json', ...(initData ? { 'x-init-data': initData } : {}) },
          body: JSON.stringify({
            kind:'step', title: step.title, body: step.body || '', ...(dueAt ? { dueAt } : {})
          }),
        });
      }
      if (Array.isArray(t.steps) && t.steps.length) {
        for (const s of t.steps) {
          try { await postItem(s); } catch {}
        }
      }

      setMsg('Дело создано. Открываю…');
      // откроем дело
      window.location.href = `/cabinet/cases/${caseId}`;
    } catch (e: any) {
      setErr(e?.message || 'Не удалось создать дело');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={{ padding:20, maxWidth:900, margin:'0 auto' }}>
      <h1 style={{ textAlign:'center', margin:'6px 0 10px' }}>{t.title}</h1>
      <div style={{
        border:'1px solid var(--border,#333)', borderRadius:12, padding:12,
        background:'var(--panel,transparent)'
      }}>
        {t.short ? <p style={{ opacity:.85, marginTop:0 }}>{t.short}</p> : null}

        {/* очень простой рендер markdown-подобного текста без внешних зависимостей */}
        <div style={{ whiteSpace:'pre-wrap', lineHeight:1.6, fontSize:14 }}>{body}</div>

        <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
          <button onClick={() => history.back()} className="list-btn" style={{ padding:'8px 12px', borderRadius:10 }}>
            ← Назад
          </button>
          <button
            onClick={createCaseFromTemplate}
            disabled={saving}
            className="list-btn"
            style={{ padding:'8px 12px', borderRadius:10 }}
          >
            {saving ? 'Создаём…' : 'Создать дело по шаблону'}
          </button>
        </div>

        {msg ? <div style={{ marginTop:8, color:'var(--tint, #69c)' }}>{msg}</div> : null}
        {err ? <div style={{ marginTop:8, color:'tomato' }}>{err}</div> : null}
      </div>

      {/* небольшой блок тэгов */}
      {t.tags?.length ? (
        <div style={{ marginTop:12, opacity:.7, fontSize:12 }}>
          Тэги: {t.tags.join(', ')}
        </div>
      ) : null}
    </main>
  );
}
