'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

function setCookie(k: string, v: string) {
  try {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${k}=${encodeURIComponent(v)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {}
}
function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function FeaturesPage() {
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

  function start() {
    setCookie('welcomed', '1');
    haptic('medium');
    const url = new URL(window.location.origin + `/home${linkSuffix}`);
    url.searchParams.set('_w', String(Date.now())); // iOS cache-busting
    window.location.replace(url.toString());
  }

  return (
    <main>
      <div className="safe" style={{ maxWidth: 640, margin:'0 auto', padding:20, display:'flex', flexDirection:'column', gap:16 }}>
        {/* Прогресс */}
        <div style={{ display:'flex', justifyContent:'center', gap:6, opacity:.6, fontSize:12 }}>
          <span>○</span><span>●</span>
        </div>

        <h1 style={{ textAlign:'center' }}>Начнём за минуту</h1>

        {/* Три акцент-карточки */}
        <div style={{ display:'grid', gap:12 }}>
          <div className="card" style={{ padding:16, border:'1px solid var(--border)', borderRadius:16 }}>
            <div className="card__left"><span className="card__icon">📝</span><span className="card__title">Тексты и резюме</span></div>
            <p style={{ marginTop:8, opacity:.85, lineHeight:1.6, fontSize:13 }}>
              От черновика до готового результата. Подсказки, структура и проверка ошибок.
            </p>
          </div>

          <div className="card card--pro" style={{ padding:16, borderRadius:16 }}>
            <div className="card__left"><span className="card__icon">🎯</span><span className="card__title">Ежедневные задачи (Pro)</span></div>
            <p style={{ marginTop:8, opacity:.85, lineHeight:1.6, fontSize:13 }}>
              1-клик сценарии: планы на день, идеи, анализ, чек-листы.
            </p>
          </div>

          <div className="card card--proplus" style={{ padding:16, borderRadius:16 }}>
            <div className="card__left"><span className="card__icon">🚀</span><span className="card__title">Эксперт-центр (Pro+)</span></div>
            <p style={{ marginTop:8, opacity:.9, lineHeight:1.6, fontSize:13 }}>
              Глубокие ассистенты: запуск и валидация идей, стратегия, исследования.
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
          <Link
            href={`/language${linkSuffix}` as Route}
            className="list-btn"
            style={{ textDecoration:'none', padding:'10px 16px', borderRadius:12 }}
            onClick={() => haptic('light')}
          >
            ← Назад
          </Link>

          <button
            type="button"
            onClick={start}
            className="list-btn"
            style={{
              padding:'12px 18px', borderRadius:12,
              background:'linear-gradient(135deg, #6a5cff, #3a7bff)',
              border:'1px solid #4b57b3'
            }}
          >
            Начать
          </button>
        </div>

        {/* Маленькая подсказка */}
        <p style={{ textAlign:'center', opacity:.55, fontSize:12, marginTop:6 }}>
          Язык интерфейса можно поменять внизу главной страницы.
        </p>
      </div>
    </main>
  );
}
