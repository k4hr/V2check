// app/home/pro/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback, type ReactElement } from 'react';
import BackBtn from '../../components/BackBtn';
import CardLink, { UI_STRINGS } from '@/components/CardLink';
import type { Route } from 'next';

// ✨ добавляем i18n
import { getProStrings } from '@/lib/i18n/pro';
import { readLocale } from '@/lib/i18n';

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

export default function Page(): ReactElement {
  const [query, setQuery] = useState('');

  // текущая локаль и словарь раздела
  const locale = readLocale();
  const dict = getProStrings(locale);
  // UI-строки карточек (если у CardLink тоже есть i18n — переключаем)
  const ui = UI_STRINGS[locale] ?? UI_STRINGS.ru;

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  // пробрасываем welcomed=1 и ?id= (если есть)
  const linkSuffix = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const sp = new URLSearchParams(u.search);
      sp.set('welcomed', '1');
      const id = u.searchParams.get('id');
      if (id) sp.set('id', id);
      return `?${sp.toString()}`;
    } catch {
      return '?welcomed=1';
    }
  }, []);

  // Префил из ?q=
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      const q = u.searchParams.get('q');
      if (q) setQuery(q);
    } catch {}
  }, []);

  // короче обращаться к dict.tool
  const t = dict.tool;

  const tools = useMemo<ToolItem[]>(
    () => [
      // ЕЖЕДНЕВНЫЕ / ОРГАНИЗАЦИЯ
      { icon: '🌅', title: t.morning.title,        subtitle: t.morning.subtitle,        href: (`/home/pro/morning${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📆', title: t.weeklyPlan.title,     subtitle: t.weeklyPlan.subtitle,     href: (`/home/pro/weekly-plan${linkSuffix}` as Route), variant: 'pro' },
      { icon: '⏳', title: t.timeBlocks.title,     subtitle: t.timeBlocks.subtitle,     href: (`/home/pro/time-blocks${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧽', title: t.quickCleaning.title,  subtitle: t.quickCleaning.subtitle,  href: (`/home/pro/quick-cleaning${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧠', title: t.mindDump.title,       subtitle: t.mindDump.subtitle,       href: (`/home/pro/mind-dump${linkSuffix}` as Route), variant: 'pro' },
      { icon: '⚡', title: t.focusSprint.title,    subtitle: t.focusSprint.subtitle,    href: (`/home/pro/focus-sprint${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🔁', title: t.habitPlan.title,      subtitle: t.habitPlan.subtitle,      href: (`/home/pro/habit-plan${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💧', title: t.waterTracker.title,   subtitle: t.waterTracker.subtitle,   href: (`/home/pro/water-tracker${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💪', title: t.microWorkout.title,   subtitle: t.microWorkout.subtitle,   href: (`/home/pro/micro-workout${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧘', title: t.postureBreak.title,   subtitle: t.postureBreak.subtitle,   href: (`/home/pro/posture-break${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧺', title: t.declutterPlan.title,  subtitle: t.declutterPlan.subtitle,  href: (`/home/pro/declutter-plan${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📍', title: t.errandRoute.title,    subtitle: t.errandRoute.subtitle,    href: (`/home/pro/errand-route${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🏙️', title: t.cityDay.title,       subtitle: t.cityDay.subtitle,        href: (`/home/pro/city-day${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎒', title: t.packList.title,       subtitle: t.packList.subtitle,       href: (`/home/pro/pack-list${linkSuffix}` as Route), variant: 'pro' },

      // ЗДОРОВЬЕ / БЫТ
      { icon: '🩺', title: t.healthVisit.title,    subtitle: t.healthVisit.subtitle,    href: (`/home/pro/health-visit${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🐾', title: t.petCare.title,        subtitle: t.petCare.subtitle,        href: (`/home/pro/pet-care${linkSuffix}` as Route), variant: 'pro' },
      { icon: '😴', title: t.sleepHygiene.title,   subtitle: t.sleepHygiene.subtitle,   href: (`/home/pro/sleep-hygiene${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🥗', title: t.mealPlanMini.title,   subtitle: t.mealPlanMini.subtitle,   href: (`/home/pro/meal-plan-mini${linkSuffix}` as Route), variant: 'pro' },

      // ДОСУГ / КОНТЕНТ
      { icon: '🎬', title: t.cinema.title,         subtitle: t.cinema.subtitle,         href: (`/home/pro/cinema${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📺', title: t.seriesPick.title,     subtitle: t.seriesPick.subtitle,     href: (`/home/pro/series-pick${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍥', title: t.anime.title,          subtitle: t.anime.subtitle,          href: (`/home/pro/anime${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📚', title: t.bookPick.title,       subtitle: t.bookPick.subtitle,       href: (`/home/pro/book-pick${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎮', title: t.gamePick.title,       subtitle: t.gamePick.subtitle,       href: (`/home/pro/game-pick${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎵', title: t.playlistMood.title,   subtitle: t.playlistMood.subtitle,   href: (`/home/pro/playlist-mood${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎲', title: t.boardgameMatch.title, subtitle: t.boardgameMatch.subtitle, href: (`/home/pro/boardgame-match${linkSuffix}` as Route), variant: 'pro' },

      // ОТНОШЕНИЯ / ТЕКСТЫ
      { icon: '💞', title: t.dateNight.title,      subtitle: t.dateNight.subtitle,      href: (`/home/pro/date-night${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🕊️', title: t.conflictNotes.title, subtitle: t.conflictNotes.subtitle,  href: (`/home/pro/conflict-notes${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🥂', title: t.eventToast.title,     subtitle: t.eventToast.subtitle,     href: (`/home/pro/event-toast${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎁', title: t.giftIdeas.title,      subtitle: t.giftIdeas.subtitle,      href: (`/home/pro/gift-ideas${linkSuffix}` as Route), variant: 'pro' },
      { icon: '📝', title: t.essay.title,          subtitle: t.essay.subtitle,          href: (`/home/pro/essay${linkSuffix}` as Route), variant: 'pro' },
      { icon: '⭐', title: t.review.title,         subtitle: t.review.subtitle,         href: (`/home/pro/review${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🎤', title: t.rapLyrics.title,      subtitle: t.rapLyrics.subtitle,      href: (`/home/pro/rap-lyrics${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🧒', title: t.kidsPoem.title,       subtitle: t.kidsPoem.subtitle,       href: (`/home/pro/kids-poem${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🏷️', title: t.hashtagHelper.title,  subtitle: t.hashtagHelper.subtitle,  href: (`/home/pro/hashtag-helper${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💡', title: t.brandName.title,      subtitle: t.brandName.subtitle,      href: (`/home/pro/brand-name${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍼', title: t.babyName.title,       subtitle: t.babyName.subtitle,       href: (`/home/pro/baby-name${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🗓️', title: t.meetingAgenda.title,  subtitle: t.meetingAgenda.subtitle,  href: (`/home/pro/meeting-agenda${linkSuffix}` as Route), variant: 'pro' },

      // ВЫБОР / ПОКУПКИ
      { icon: '⚖️', title: t.chooseBetween.title,  subtitle: t.chooseBetween.subtitle,  href: (`/home/pro/choose-between${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🚗', title: t.carPick.title,        subtitle: t.carPick.subtitle,        href: (`/home/pro/car-pick${linkSuffix}` as Route), variant: 'pro' },

      // ДЕНЬГИ
      { icon: '💸', title: t.quickBudget.title,    subtitle: t.quickBudget.subtitle,    href: (`/home/pro/quick-budget${linkSuffix}` as Route), variant: 'pro' },
      { icon: '💳', title: t.debtPayoff.title,     subtitle: t.debtPayoff.subtitle,     href: (`/home/pro/debt-payoff${linkSuffix}` as Route), variant: 'pro' },

      // ЕДА И НАПИТКИ
      { icon: '🍷', title: t.wine.title,           subtitle: t.wine.subtitle,           href: (`/home/pro/wine${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍺', title: t.beer.title,           subtitle: t.beer.subtitle,           href: (`/home/pro/beer${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🥃', title: t.spirits.title,        subtitle: t.spirits.subtitle,        href: (`/home/pro/spirits${linkSuffix}` as Route), variant: 'pro' },
      { icon: '🍿', title: t.snackPair.title,      subtitle: t.snackPair.subtitle,      href: (`/home/pro/snack-pair${linkSuffix}` as Route), variant: 'pro' },

      // ПРОГУЛКИ
      { icon: '🚶', title: t.walkProgram.title,    subtitle: t.walkProgram.subtitle,    href: (`/home/pro/walk-program${linkSuffix}` as Route), variant: 'pro' },
    ],
    [linkSuffix, t]
  );

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return tools;
    return tools.filter(
      (ti) => norm(ti.title).includes(q) || norm(ti.subtitle).includes(q)
    );
  }, [query, tools]);

  const onInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.currentTarget.value),
    []
  );
  const clear = useCallback(() => setQuery(''), []);

  return (
    <main className="lm-wrap">
      <BackBtn fallback={`/home${linkSuffix}` as Route} />

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
        {dict.title}
      </h1>

      <p className="lm-subtitle" style={{ textAlign: 'center' }}>
        {dict.chooseTool}
      </p>

      <div style={{ marginTop: 12, position: 'relative' }}>
        <input
          type="search"
          inputMode="search"
          placeholder={dict.searchPlaceholder}
          aria-label={dict.searchAria}
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
            aria-label="Clear"
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
          <div className="empty">{dict.notFound}</div>
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
