// app/solutions/[slug]/page.tsx
'use client';

export const dynamic = 'force-static';

import { useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSolutionBySlug, buildContent } from '../solutions.data';

export default function SolutionPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const data = useMemo(() => getSolutionBySlug(String(slug)), [slug]);
  const content = useMemo(() => (data ? buildContent(data) : ''), [data]);

  // TWA + back
  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    try {
      tg?.ready?.();
      tg?.expand?.();
      tg?.BackButton?.show?.();
      tg?.BackButton?.onClick?.(() => {
        if (document.referrer) history.back();
        else router.push('/solutions');
      });
    } catch {}
  }, [router]);

  if (!data) {
    return (
      <main style={{ padding: 20 }}>
        <h1>Не найдено</h1>
        <p style={{ opacity: 0.7 }}>
          Раздел недоступен или ещё не подготовлен. Вернитесь назад.
        </p>
      </main>
    );
  }

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 8 }}>{data.title}</h1>
      <div className="card" style={{ lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
        {content}
      </div>

      <div style={{ height: 14 }} />
      <button
        onClick={() => (document.referrer ? history.back() : router.push('/solutions'))}
        className="list-btn"
        style={{ maxWidth: 200 }}
      >
        ← Назад
      </button>
    </main>
  );
}
