// components/CardLink.tsx
'use client';

import Link from 'next/link';
import type { Route } from 'next';

type Variant = 'default' | 'pro' | 'proplus';

/** ===== Статические строки (i18n-light) ===== */
export type Locale = 'ru' | 'en';

type UiPack = {
  searchPlaceholder: string;
  notFound: string;
  chooseTool: string;
  searchAria: string;
};

export const UI_STRINGS: Record<Locale, UiPack> = {
  ru: {
    searchPlaceholder: 'Поиск по инструментам…',
    notFound: 'Ничего не найдено',
    chooseTool: 'Выберите инструмент',
    searchAria: 'Поиск по инструментам',
  },
  en: {
    searchPlaceholder: 'Search tools…',
    notFound: 'Nothing found',
    chooseTool: 'Choose a tool',
    searchAria: 'Search tools',
  },
};

/** Удобный хелпер: t('searchPlaceholder', 'ru') */
export function t<K extends keyof UiPack>(key: K, locale: Locale = 'ru'): UiPack[K] {
  const pack = UI_STRINGS[locale] || UI_STRINGS.ru;
  return pack[key];
}
/** =========================================== */

type CardBaseProps = {
  icon?: string;          // emoji/иконка слева
  title: string;          // заголовок
  subtitle?: string;      // подзаголовок в 1–2 строки
  variant?: Variant;      // подсветка
  className?: string;
  style?: React.CSSProperties;
};

type CardLinkProps =
  | ({ href: Route } & CardBaseProps)             // ссылка
  | ({ disabled: true } & CardBaseProps);         // заглушка «скоро»

export default function CardLink(props: CardLinkProps) {
  const { icon = '📦', title, subtitle, variant = 'default', className, style } = props;

  const content = (
    <>
      <span className="card__left">
        <span
          className={
            'card__icon ' +
            (variant === 'pro' ? 'card__icon--pro ' :
             variant === 'proplus' ? 'card__icon--proplus ' : '')
          }
        >
          {icon}
        </span>
        <span className="card__text">
          <div className="card__title">{title}</div>
          {subtitle ? <div className="card__subtitle">{subtitle}</div> : null}
        </span>
      </span>
      {'href' in props ? <span className="card__chev">›</span> : <span className="card__soon">Скоро</span>}
      <style jsx>{`
        .card {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px; border-radius: 14px;
          background: #161b25; border: 1px solid rgba(255,255,255,.08);
          color: inherit; box-shadow: 0 6px 24px rgba(0,0,0,.25);
          transition: transform .12s ease, box-shadow .12s ease, border-color .12s ease;
        }
        .card:hover { transform: translateY(-1px); }
        .card__left { display: flex; gap: 12px; align-items: center; }
        .card__icon {
          width: 36px; height: 36px; display: grid; place-items: center; font-size: 20px;
          background: rgba(255,255,255,.06); border-radius: 10px;
        }
        .card__title { font-weight: 800; font-size: 16px; line-height: 1.1; }
        .card__subtitle { opacity: .78; font-size: 13px; margin-top: 2px; }
        .card__chev { opacity: .6; font-size: 22px; }
        .card__soon { opacity: .65; font-size: 14px; }

        /* Фиолетовая подсветка (Pro) */
        .card--pro {
          border-color: rgba(91, 140, 255, .45);
          box-shadow:
            0 10px 30px rgba(91, 140, 255, .16),
            inset 0 0 0 1px rgba(91, 140, 255, .10);
        }
        .card__icon--pro {
          background: radial-gradient(120% 120% at 20% 20%, rgba(120,150,255,.45),
            rgba(120,150,255,.08) 60%, rgba(255,255,255,.05));
        }

        /* Золотая подсветка (Pro+) */
        .card--proplus {
          border-color: rgba(255, 191, 73, .45);
          box-shadow:
            0 10px 30px rgba(255,191,73,.18),
            inset 0 0 0 1px rgba(255,191,73,.10);
        }
        .card__icon--proplus {
          background: radial-gradient(120% 120% at 20% 20%, rgba(255,210,120,.55),
            rgba(255,210,120,.10) 60%, rgba(255,255,255,.05));
        }
      `}</style>
    </>
  );

  const cls =
    'card ' +
    (variant === 'pro' ? 'card--pro ' :
     variant === 'proplus' ? 'card--proplus ' : '') +
    (className || '');

  if ('href' in props) {
    return (
      <Link href={props.href as Route} className={cls} style={{ textDecoration: 'none', ...style }}>
        {content}
      </Link>
    );
  }
  return (
    <div className={cls} style={{ opacity: .6, ...style }}>
      {content}
    </div>
  );
}
