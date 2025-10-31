/* path: app/home/game/page.tsx */
'use client';

import Link from 'next/link';
import { useEffect } from 'react';

function haptic(type:'light'|'medium'='light'){
  try{ (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type);}catch{}
}

export default function GiveawayPage(){
  useEffect(() => {
    const tg:any = (window as any)?.Telegram?.WebApp;
    try { tg?.ready?.(); tg?.expand?.(); } catch {}
    try {
      tg?.BackButton?.show?.();
      const back = () => { if (document.referrer) history.back(); else window.location.href = '/home'; };
      tg?.BackButton?.onClick?.(back);
      return () => { tg?.BackButton?.hide?.(); tg?.BackButton?.offClick?.(back); };
    } catch {}
  }, []);

  return (
    <main className="safe">
      <button
        type="button"
        onClick={() => (document.referrer ? history.back() : (window.location.href = '/home'))}
        className="back"
        aria-label="Назад"
      >
        <span>←</span><b>Назад</b>
      </button>

      <h1 className="title">Розыгрыш подписок CHATGPT 5</h1>
      <p className="lead">
        Мы разыгрываем <b>80 призов</b> среди пользователей приложения:
        <br/>10 годовых, 20 полугодовых и 50 месячных подписок.
      </p>

      <div className="cta-wrap">
        <Link href="/pro" className="cta" onClick={()=>haptic('medium')}>Купить подписку</Link>
        <Link href="/pro#proplus" className="cta cta--ghost" onClick={()=>haptic('light')}>Перейти к Pro+</Link>
      </div>

      <section className="card">
        <h3>Сроки</h3>
        <p>
          Розыгрыш действует до <b>01.01.2026</b> (включительно).<br/>
          Покупки, оплаченные в этот период, участвуют автоматически.
        </p>
      </section>

      <section className="card">
        <h3>Как участвовать</h3>
        <ol>
          <li>Оформите любую платную подписку в приложении.</li>
          <li>После успешной оплаты вы автоматически попадаете в таблицу участников.</li>
          <li>Каждая покупка даёт несколько «записей» — больше записей, выше шанс выиграть.</li>
        </ol>
      </section>

      <section className="grid">
        <div className="card">
          <h4>Сколько записей даёт тариф <span className="badge">Pro</span></h4>
          <ul className="list">
            <li><b>Неделя</b> — 1 запись</li>
            <li><b>Месяц</b> — 2 записи</li>
            <li><b>Полгода</b> — 5 записей</li>
            <li><b>Год</b> — 10 записей</li>
          </ul>
        </div>
        <div className="card">
          <h4>Тариф <span className="badge badge--gold">Pro+</span> (как у Pro, но <b>+2</b>)</h4>
          <ul className="list">
            <li><b>Неделя</b> — 3 записи</li>
            <li><b>Месяц</b> — 4 записи</li>
            <li><b>Полгода</b> — 7 записей</li>
            <li><b>Год</b> — 12 записей</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <h3>Что мы фиксируем</h3>
        <p>
          В таблицу попадают: ID пользователя, тариф и срок, дата/время, ID платежа, количество записей.
          Несколько покупок суммируются.
        </p>
      </section>

      <section className="card">
        <h3>Итоги и прозрачность</h3>
        <ul className="list">
          <li>Победителей выбираем случайно среди всех записей.</li>
          <li>Публикуем список победителей в приложении.</li>
          <li>Возвраты/отмены — записи удаляются.</li>
        </ul>
      </section>

      <section className="note">
        <p>
          Участвуют только успешные оплаты в период розыгрыша. Один человек — один аккаунт.
          Подозрительная активность может быть исключена. Призы не обмениваются на деньги.
        </p>
      </section>

      <style jsx>{`
        .safe { max-width: 760px; margin: 0 auto; padding: 20px; display:flex; flex-direction:column; gap:14px; }
        .title { text-align:center; margin: 4px 0 2px; }
        .lead { text-align:center; opacity:.9; }
        .back {
          width: 120px; padding: 10px 14px; border-radius: 12px;
          background:#171a21; border:1px solid var(--border);
          display:flex; align-items:center; gap:8px;
        }
        .cta-wrap { display:flex; gap:10px; justify-content:center; margin: 2px 0 6px; }
        .cta {
          text-decoration:none; padding:10px 16px; border-radius:12px; font-weight:700;
          background: linear-gradient(135deg,#3341ff22,#8aa3ff22);
          border:1px solid #6274ff;
          box-shadow: 0 10px 26px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.05);
        }
        .cta--ghost { background:#171a21; border:1px solid var(--border); }

        .grid { display:grid; gap:12px; grid-template-columns: 1fr; }
        @media (min-width: 700px){ .grid { grid-template-columns: 1fr 1fr; } }

        .card {
          border:1px solid rgba(255,255,255,.08);
          background: radial-gradient(120% 140% at 10% 0%, rgba(76,130,255,.06), rgba(255,255,255,.03));
          border-radius:14px; padding:14px 16px;
          box-shadow: 0 10px 26px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.04);
        }
        .badge {
          display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; margin-left:4px;
          background:#2a2f45; border:1px solid rgba(255,255,255,.12);
        }
        .badge--gold { background:#3a2d12; border-color:#caa86a; }

        .list { margin: 8px 0 0 16px; display:grid; gap:6px; }
        .note {
          opacity:.8; font-size:12.5px; border-left:3px solid #6274ff; padding:10px 12px; margin-top:2px;
          background: #111622; border-radius:10px;
        }
      `}</style>
    </main>
  );
}
