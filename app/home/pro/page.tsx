// app/home/pro/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import BackBtn from '../../components/BackBtn';
import CardLink, { UI_STRINGS } from '@/components/CardLink';
import type { Route } from 'next';

type ToolItem = {
  title: string;
  subtitle: string;
  icon: string;
  href: Route;
  variant?: 'default' | 'pro';
};

function norm(s: string) {
  return (s || '').toLowerCase().normalize('NFC').trim();
}

export default function ProHub() {
  const [query, setQuery] = useState('');
  const ui = UI_STRINGS.ru;

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // пробрасываем ?id=
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id ? `?id=${encodeURIComponent(id)}` : '';
    } catch { return ''; }
  }, []);

  // Префил из ?q=
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const q = u.searchParams.get('q');
      if (q) setQuery(q);
    } catch {}
  }, []);

  const tools = useMemo<ToolItem[]>(
    () => [
      // ЕЖЕДНЕВНЫЕ / ОРГАНИЗАЦИЯ
      { icon: '🌅', title: 'Утренний ритуал',        subtitle: 'План на 20–30 минут',      href: (`/home/pro/morning${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📆', title: 'План на неделю',         subtitle: 'Неделя без стресса',       href: (`/home/pro/weekly-plan${linkSuffix}` as Route), variant: 'pro' },
      { icon: '⏳', title: 'Таймблоки дня',          subtitle: 'День по блокам',           href: (`/home/pro/time-blocks${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧽', title: 'Быстрая уборка дома',    subtitle: 'Скорая уборка по шагам',   href: (`/home/pro/quick-cleaning${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧠', title: 'Разгрузка головы',       subtitle: 'Быстрая очистка мыслей',   href: (`/home/pro/mind-dump${linkSuffix}` as Route), variant: 'pro' },
      { icon: '⚡', title: 'Фокус-спринт',           subtitle: '25–40 минут концентрации', href: (`/home/pro/focus-sprint${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🔁', title: 'План привычки',          subtitle: 'Шаги, триггеры, трекер',   href: (`/home/pro/habit-plan${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💧', title: 'Трекер воды',            subtitle: 'Сколько пить в день',      href: (`/home/pro/water-tracker${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💪', title: 'Микро-тренировка',       subtitle: '5–15 минут дома',          href: (`/home/pro/micro-workout${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧘', title: 'Перерыв для осанки',     subtitle: '2–3 минуты выпрямиться',   href: (`/home/pro/posture-break${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧺', title: 'Разгребаем завалы',      subtitle: 'Деклаттер по зонам',       href: (`/home/pro/declutter-plan${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📍', title: 'Маршрут дел по городу',  subtitle: 'Сэкономим время в пути',   href: (`/home/pro/errand-route${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🏙️', title: 'День в городе',         subtitle: 'Готовый мини-маршрут',     href: (`/home/pro/city-day${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎒', title: 'Список в поездку',       subtitle: 'Ничего не забыть',         href: (`/home/pro/pack-list${linkSuffix}` as Route), variant: 'pro' },

      // ЗДОРОВЬЕ / БЫТ
      { icon: '🩺', title: 'К визиту к врачу',       subtitle: 'Вопросы и заметки',        href: (`/home/pro/health-visit${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🐾', title: 'Уход за питомцем',       subtitle: 'Корм, прогулки, здоровье', href: (`/home/pro/pet-care${linkSuffix}` as Route), variant: 'pro' },
      { icon: '😴', title: 'Гигиена сна',            subtitle: 'План улучшения сна',       href: (`/home/pro/sleep-hygiene${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🥗', title: 'Мини-план питания',      subtitle: 'Меню на 1–3 дня',          href: (`/home/pro/meal-plan-mini${linkSuffix}` as Route), variant: 'pro' },

      // ДОСУГ / КОНТЕНТ
      { icon: '🎬', title: 'Выбрать фильм/сериал',   subtitle: 'Персональный подбор',      href: (`/home/pro/cinema${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📺', title: 'Подбор сериала',         subtitle: 'Найдем «тот самый»',       href: (`/home/pro/series-pick${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍥', title: 'Выбор аниме',            subtitle: 'Идеально под ваш вкус',    href: (`/home/pro/anime${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📚', title: 'Подбор книги',           subtitle: 'Книги под ваш вкус',       href: (`/home/pro/book-pick${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎮', title: 'Выбор видеоигры',        subtitle: 'Под интересы и время',     href: (`/home/pro/game-pick${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎵', title: 'Плейлист по настроению', subtitle: 'Треки под вайб дня',        href: (`/home/pro/playlist-mood${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎲', title: 'Настолка под компанию',  subtitle: 'Матч по жанру и людям',    href: (`/home/pro/boardgame-match${linkSuffix}` as Route), variant: 'pro' },

      // ОТНОШЕНИЯ / ТЕКСТЫ
      { icon: '💞', title: 'Свидание-план',          subtitle: 'Сценарий под вас',         href: (`/home/pro/date-night${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🕊️', title: 'Разбор конфликта',      subtitle: 'Спокойные формулировки',   href: (`/home/pro/conflict-notes${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🥂', title: 'Тост/поздравление',      subtitle: 'Уместно и по делу',        href: (`/home/pro/event-toast${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎁', title: 'Идеи подарков',          subtitle: 'Под человека и бюджет',    href: (`/home/pro/gift-ideas${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📝', title: 'Эссе без палев',         subtitle: 'Живой человеческий стиль', href: (`/home/pro/essay${linkSuffix}` as Route), variant: 'pro' },
      { icon: '⭐', title: 'Отзыв/рекомендация',     subtitle: 'Позитив/нейтр/негатив',    href: (`/home/pro/review${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎤', title: 'Рэп-текст',             subtitle: 'Ритм, смысл, хуки',        href: (`/home/pro/rap-lyrics${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧒', title: 'Детский стих',           subtitle: 'Для 8–10 лет',             href: (`/home/pro/kids-poem${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🏷️', title: 'Хэштеги к посту',       subtitle: 'Ядро и вариации',          href: (`/home/pro/hashtag-helper${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💡', title: 'Название бренда',        subtitle: 'Коротко и цепко',          href: (`/home/pro/brand-name${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍼', title: 'Имя для ребёнка',        subtitle: 'Смысл, краткие формы',     href: (`/home/pro/baby-name${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🗓️', title: 'Повестка встречи',      subtitle: 'Чёткая структура',         href: (`/home/pro/meeting-agenda${linkSuffix}` as Route), variant: 'pro' },

      // ВЫБОР / ПОКУПКИ
      { icon: '⚖️', title: 'Выбор между вариантами',subtitle: 'Помогу определиться',       href: (`/home/pro/choose-between${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🚗', title: 'Подбор авто',            subtitle: 'Под бюджет и цели',        href: (`/home/pro/car-pick${linkSuffix}` as Route), variant: 'pro' },

      // ДЕНЬГИ
      { icon: '💸', title: 'Быстрый бюджет',         subtitle: 'Бюджет и лимиты',          href: (`/home/pro/quick-budget${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💳', title: 'Закрыть долги',          subtitle: 'План выплат и сроки',      href: (`/home/pro/debt-payoff${linkSuffix}` as Route), variant: 'pro' },

      // ЕДА И НАПИТКИ
      { icon: '🍷', title: 'Выбор вина',             subtitle: 'Стиль и закуски',          href: (`/home/pro/wine${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍺', title: 'Выбор пива',             subtitle: 'Стили и пары',             href: (`/home/pro/beer${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🥃', title: 'Крепкий алкоголь',       subtitle: 'Профиль и подача',         href: (`/home/pro/spirits${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍿', title: 'Закуска к напитку',      subtitle: 'Лучшие сочетания',         href: (`/home/pro/snack-pair${linkSuffix}` as Route), variant: 'pro' },

      // ПРОГУЛКИ
      { icon: '🚶', title: 'План прогулок',          subtitle: 'Шаги, маршруты, мотивация',href: (`/home/pro/walk-program${linkSuffix}` as Route), variant: 'pro' },
    ],
    [linkSuffix]
  );

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return tools;
    return tools.filter(
      (t) => norm(t.title).includes(q) || norm(t.subtitle).includes(q)
    );
  }, [query, tools]);

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.currentTarget.value),
    []
  );

  const clear = useCallback(() => setQuery(''), []);

  return (
    <main className="lm-wrap">
      <BackBtn fallback="/home" />

      <h1
        style={{
          textAlign: 'center',
          whiteSpace: 'nowrap',
          overflow: 'visible',
          textOverflow: 'clip',
          fontSize: 'clamp(18px, 6vw, 28px)',
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        Ежедневные задачи
      </h1>

      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        {ui.chooseTool}
      </p>

      <div style={{ marginTop: 12, position: 'relative' }}>
        <input
          type="search"
          inputMode="search"
          placeholder={ui.searchPlaceholder}
          aria-label={ui.searchAria}
          value={query}
          onChange={onInput}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 12,
            background: '#141823',
            border: '1px solid var(--border)',
            color: 'var(--fg, #fff)',
            outline: 'none'
          }}
        />
        {query ? (
          <button
            onClick={clear}
            aria-label="Очистить"
            style={{
              position: 'absolute',
              right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: 999,
              border: 0, background: 'rgba(255,255,255,.12)',
              color: 'inherit', fontSize: 18, lineHeight: '28px'
            }}
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="lm-grid" style={{ marginTop: 14 }}>
        {filtered.length === 0 ? (
          <div className="empty">{ui.notFound}</div>
        ) : (
          filtered.map((t, i) => (
            <CardLink
              key={`${t.title}-${i}`}
              href={t.href}
              icon={t.icon}
              title={t.title}
              subtitle={t.subtitle}
              variant={t.variant || 'default'}
            />
          ))
        )}
      </div>

      <style jsx>{`
        .lm-wrap { padding: 20px; max-width: 780px; margin: 0 auto; }
        .lm-subtitle { opacity: .7; margin-top: 6px; }
        .lm-grid { display: grid; gap: 12px; }
        .empty { opacity: .7; padding: 12px 8px; text-align: center; }
      `}</style>
    </main>
  );
}
