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
        Разыгрываем <b>80 призов</b> среди пользователей приложения:
        10 годовых, 20 полугодовых и 50 месячных подписок.
      </p>

      <div className="cta-wrap">
        <Link href="/pro" className="cta" onClick={()=>haptic('medium')}>Участвовать</Link>
      </div>

      <h2>Сроки</h2>
      <p>
        Розыгрыш действует до <b>01.01.2026</b> (включительно). Покупки,
        оплаченные в этот период, участвуют автоматически.
      </p>

      <h2>Как участвовать</h2>
      <ol>
        <li>Оформите любую платную подписку в приложении.</li>
        <li>После успешной оплаты вы автоматически попадаете в таблицу участников.</li>
        <li>Каждая покупка даёт несколько записей — больше записей, выше шанс выиграть.</li>
      </ol>

      <h3>Сколько записей даёт тариф <span className="badge">Pro</span></h3>
      <ul>
        <li><b>Неделя</b> — 1 запись</li>
        <li><b>Месяц</b> — 2 записи</li>
        <li><b>Полгода</b> — 5 записей</li>
        <li><b>Год</b> — 10 записей</li>
      </ul>

      <h3>Тариф <span className="badge badge--gold">Pro+</span> (как у Pro, но <b>+2</b> к каждой позиции)</h3>
      <ul>
        <li><b>Неделя</b> — 3 записи</li>
        <li><b>Месяц</b> — 4 записи</li>
        <li><b>Полгода</b> — 7 записей</li>
        <li><b>Год</b> — 12 записей</li>
      </ul>

      <h2>Что мы фиксируем</h2>
      <p>
        В таблице сохраняются: ID пользователя, тариф и срок, дата/время, ID платежа, количество записей.
        Несколько покупок суммируются.
      </p>

      <h2>Итоги и прозрачность</h2>
      <ul>
        <li>Победителей выбираем случайно среди всех записей.</li>
        <li>Список победителей публикуем в приложении.</li>
        <li>При возврате или отмене платежа записи удаляются.</li>
      </ul>

      <p className="note">
        Участвуют только успешные оплаты в период розыгрыша. Один человек — один аккаунт.
        Подозрительная активность может быть исключена. Призы не обмениваются на деньги.
      </p>

      <style jsx>{`
        .safe { max-width: 760px; margin: 0 auto; padding: 20px; }
        .title { text-align: center; margin: 6px 0 8px; }
        .lead { text-align: center; opacity: .9; margin-bottom: 8px; }

        .back {
          width: 120px; padding: 10px 14px; border-radius: 12px;
          background:#171a21; border:1px solid var(--border);
          display:flex; align-items:center; gap:8px; margin-bottom: 8px;
        }

        .cta-wrap { display:flex; justify-content:center; margin: 8px 0 18px; }
        .cta {
          text-decoration:none; padding:12px 18px; border-radius:12px; font-weight:800;
          background: linear-gradient(135deg,#3341ff22,#8aa3ff22);
          border:1px solid #6274ff; box-shadow: 0 10px 24px rgba(0,0,0,.35),
          inset 0 0 0 1px rgba(255,255,255,.05);
        }

        h2 { margin: 18px 0 6px; font-size: 20px; }
        h3 { margin: 14px 0 6px; font-size: 16px; opacity:.95; }
        p, ul, ol { margin: 6px 0 10px; }
        ul, ol { padding-left: 22px; display: grid; gap: 6px; }

        .badge {
          display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; margin-left:4px;
          background:#2a2f45; border:1px solid rgba(255,255,255,.12);
        }
        .badge--gold { background:#3a2d12; border-color:#caa86a; }

        .note {
          opacity:.85; font-size:12.5px; border-left:3px solid #6274ff; padding:10px 12px;
          background: #111622; border-radius:10px; margin-top: 6px;
        }
      `}</style>
    </main>
  );
}
