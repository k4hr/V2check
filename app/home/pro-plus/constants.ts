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
    emoji: '💼',
    title: 'Бизнес-чат: запуск/анализ',
    desc: 'Гипотезы, юнит-экономика, воронки, идеи роста и риски для проекта.',
    href: '/home/pro-plus/businesschat' as Route,
  },
];
