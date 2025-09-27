'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function WelcomePage() {
  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  return (
    <main>
      <div className="safe" style={{ maxWidth: 640, margin: '0 auto', padding: 20, display:'flex', flexDirection:'column', gap:16 }}>
        {/* Прогресс */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, opacity:.6, fontSize:12 }}>
          <span>●</span><span>○</span>
        </div>

        {/* Hero */}
        <div
          style={{
            position:'relative',
            border:'1px solid var(--border)',
            borderRadius:18,
            padding:18,
            background:'radial-gradient(120% 120% at 100% 0%, rgba(101,115,255,0.15), transparent 55%), #141823',
            boxShadow:'0 8px 32px rgba(0,0,0,.35) inset',
            overflow:'hidden'
          }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              width:44, height:44, borderRadius:12,
              display:'grid', placeItems:'center',
              background:'linear-gradient(135deg, #6a5cff, #3a7bff)'
            }}>
              <span style={{ fontSize:24 }}>⚡️</span>
            </div>
            <div>
              <div style={{ fontSize:18, fontWeight:800, letterSpacing:.2 }}>LiveManager</div>
              <div style={{ opacity:.75, fontSize:13 }}>Умные инструменты на каждый день</div>
            </div>
          </div>

          <div style={{ marginTop:14, lineHeight:1.65, opacity:.88 }}>
            Сразу в Telegram: планируй, решай задачи, улучшай тексты и запускай проекты — без переключения между приложениями.
          </div>
        </div>

        {/* Плюсы — коротко и ровно */}
        <div style={{ display:'grid', gap:10 }}>
          {[
            { icon:'🧰', title:'Ежедневные задачи', text:'Готовые сценарии «под ключ»: тексты, резюме, идеи и рутина.' },
            { icon:'🚀', title:'Pro+ экспертиза', text:'Глубокие ассистенты для запуска и роста проектов.' },
            { icon:'⭐', title:'Telegram Stars', text:'Моментальная активация подписки внутри Telegram.' },
          ].map((f, i) => (
            <div key={i} className="card" style={{ padding:14 }}>
              <div className="card__left">
                <span className="card__icon">{f.icon}</span>
                <span className="card__title">{f.title}</span>
              </div>
              <p style={{ marginTop:6, opacity:.85, lineHeight:1.6, fontSize:13 }}>{f.text}</p>
            </div>
          ))}
        </div>

        {/* Дальше */}
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
          <Link
            href={`/country${linkSuffix}` as Route}
            className="list-btn"
            style={{ textDecoration:'none', padding:'12px 16px', borderRadius:12 }}
            onClick={() => haptic('light')}
          >
            Далее →
          </Link>
        </div>
      </div>
    </main>
  );
}
