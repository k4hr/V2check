// app/home/pro-plus/constants.ts
import type { Route } from 'next';

export type Row = { emoji: string; title: string; desc: string; href: Route };

export const PRO_PLUS_TITLE = 'Эксперт центр Pro+';
export const PRO_PLUS_SUBTITLE = 'Выберите инструмент';
export const PRO_PLUS_CTA = 'Попробовать';

export const PRO_PLUS_ROWS: Row[] = [
  {
    emoji: '⚖️',
    title: 'Юрист-помощник',
    desc: 'Решу любую твою проблему.',
    href: '/home/pro-plus/urchatgpt' as Route,
  },
  {
    emoji: '🚀',
    title: 'Бизнес: запуск',
    desc: 'От идеи до MVP: гипотезы, юнит-экономика, чек-листы.',
    href: '/home/pro-plus/business-launch' as Route,
  },
  {
    emoji: '📈',
    title: 'Личный маркетолог',
    desc: 'Стратегия продвижения, контент-план, воронки, KPI.',
    href: '/home/pro-plus/marketing' as Route,
  },
  {
    emoji: '🖼️',
    title: 'Генерация изображений',
    desc: 'Создам картинки по вашему брифу: стиль, ракурс, палитра.',
    href: '/home/pro-plus/image-gen' as Route,
  },
];
