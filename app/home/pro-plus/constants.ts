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
    emoji: '🏋️‍♂️',
    title: 'Личный тренер',
    desc: 'План тренировок, питание, прогресс и техника.',
    href: '/home/pro-plus/lichny-trener' as Route,
  },
  {
    emoji: '🥗',
    title: 'Личный диетолог',
    desc: 'Индивидуальное питание под цель: калории, БЖУ, меню и список покупок.',
    href: '/home/pro-plus/lichny-dietolog' as Route,
  },
  {
    emoji: '🧠',
    title: 'Личный психолог',
    desc: 'Поддержка и КПТ-практики: стресс, тревожность, сон, привычки.',
    href: '/home/pro-plus/lichny-psiholog' as Route,
  },
  {
    emoji: '❤️',
    title: 'Личный сексолог',
    desc: 'Деликатные вопросы о близости: коммуникация, либидо, гармония.',
    href: '/home/pro-plus/lichny-seksolog' as Route,
  },
  {
    emoji: '💰',
    title: 'Личный финансовый советник',
    desc: 'Бюджет, инвестиции, долги: план на месяц/год, риски и цели.',
    href: '/home/pro-plus/lichny-finansovy-sovetnik' as Route,
  },
  {
    emoji: '💹',
    title: 'Инвест-анализ',
    desc: 'Портфель, стратегия, риски, ребалансировка.',
    href: '/home/pro-plus/invest-analiz' as Route,
  },
  {
    emoji: '📊',
    title: 'Трейд-анализ',
    desc: 'Стратегии, риск-менеджмент, точки входа/выхода.',
    href: '/home/pro-plus/treid-analiz' as Route,
  },
  {
    emoji: '🖼️',
    title: 'Генерация изображений',
    desc: 'Создам картинки по вашему брифу: стиль, ракурс, палитра.',
    href: '/home/pro-plus/image-gen' as Route,
  },
  {
    emoji: '📝',
    title: 'Составить резюме',
    desc: 'Сильное CV под вакансию: опыт, достижения, навыки, ATS.',
    href: '/home/pro-plus/resume-builder' as Route,
  },
];
