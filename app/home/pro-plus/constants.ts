/* path: app/home/pro-plus/constants.ts */
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
    emoji: '🧲',
    title: 'Удержание клиентов',
    desc: 'Снижение оттока и рост LTV: сегменты риска, win-back, метрики и план на 90 дней.',
    href: '/home/pro-plus/uderzhanie-klientov' as Route,
  },
  {
    emoji: '📺',
    title: 'SEO/каналы роста',
    desc: 'YouTube/Shorts/TG: тайтлы, описания, теги и тумбы под CTR.',
    href: '/home/pro-plus/seo-kanaly-rosta' as Route,
  },
  {
    emoji: '📄',
    title: 'Конструктор договоров',
    desc: 'Сгенерирую и проверю договор: риски, пункты, шаблоны.',
    href: '/home/pro-plus/konstruktor-dogovorov' as Route,
  },
  {
    emoji: '🧾',
    title: 'Налоговый консультант',
    desc: 'Режимы, вычеты, сроки и план подачи деклараций.',
    href: '/home/pro-plus/nalogovy-konsultant' as Route,
  },
  {
    emoji: '🛂',
    title: 'Визовый помощник',
    desc: 'Тип визы, документы, запись и сроки подачи.',
    href: '/home/pro-plus/vizovy-pomoshchnik' as Route,
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
    emoji: '💇',
    title: 'Личный стилист: прическа',
    desc: 'Подберу стрижку и укладку по фото: форма лица, стиль, уход.',
    href: '/home/pro-plus/lichny-stilist-pricheska' as Route,
  },
  {
    emoji: '🧥',
    title: 'Личный стилист: одежда',
    desc: 'Стиль и капсула под вас: фасоны, цвета, сочетания, магазины.',
    href: '/home/pro-plus/lichny-stilist-odezhda' as Route,
  },
  {
    emoji: '🤰',
    title: 'Планирование беременности',
    desc: 'Подготовка к зачатию: здоровье, анализы, витамины, образ жизни.',
    href: '/home/pro-plus/planirovanie-beremennosti' as Route,
  },
  {
    emoji: '💡',
    title: 'Контент-анализ',
    desc: 'Супер-идеи под ваш контент: темы, рубрики, крючки, форматы.',
    href: '/home/pro-plus/kontent-analiz' as Route,
  },
  {
    emoji: '🧮',
    title: 'Решение задач',
    desc: 'Математика, физика и др.: быстрое решение с пояснениями.',
    href: '/home/pro-plus/reshenie-zadach' as Route,
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
