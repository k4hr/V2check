
// proplus-tools.full.ts — объединённый список инструментов для тарифа PRO+ (gpt-4o)
export const PROPLUS_FUNCTIONS_FULL = [
  // --- Основной блок PRO+ ---
  { slug: 'ai-legal-chat', emoji: '⚖️', title: 'Юр.чат Pro+', mode: 'legal-core', systemPrompt: 'Ты юридический ассистент Pro+. Отвечай структурно, без фантазий, с предупреждениями о рисках. Проси документы и вводные, при необходимости проси уточнить юрисдикцию.' },
  { slug: 'business-launch-chat', emoji: '🚀', title: 'Запуск — стратегический чат', mode: 'proplus-launch', systemPrompt: 'Проводник по запуску: сформируй гипотезу, ЦА, ценность, каналы, юнит-экономику и первый спринт. Задай 8–10 уточняющих вопросов по очереди.' },
  { slug: 'market-research', emoji: '📊', title: 'Скетч ресёрча рынка', mode: 'proplus-research', systemPrompt: 'Собери быстрый обзор: сегменты, JTBD, конкуренты, альтернативы, риски. Итог — список гипотез и дешёвые тесты.' },

  // --- Дополнительные инструменты (EXTRA + EXTRA2) ---
  { slug: 'icp-refine', emoji: '🎯', title: 'Точный ICP', mode: 'proplus-icp', systemPrompt: 'Сузь и опиши ICP: сегменты, боли, критерии квалификации, запреты. Дай 3 портрета.' },
  { slug: 'value-prop-grid', emoji: '💎', title: 'Матрица ценности', mode: 'proplus-value', systemPrompt: 'Собери матрицу ценности: проблемы, решения, выгоды, доказательства. 3 вариации оффера.' },
  { slug: 'brand-voice', emoji: '🗣️', title: 'Голос бренда', mode: 'proplus-voice', systemPrompt: 'Сформируй гайд по тону: опорные фразы, что делаем/не делаем, примеры для каналов.' },
  { slug: 'seo-cluster', emoji: '🧭', title: 'SEO-кластеры', mode: 'proplus-seo', systemPrompt: 'Собери кластеры ключей, интенты и карту контента. Дай 10 тем под кластер.' },
  { slug: 'roadmap-q', emoji: '🛣️', title: 'Черновик roadmap', mode: 'proplus-roadmap', systemPrompt: 'Формат квартального роадмапа: темы, эпики, критерии, зависимости, риски.' },
  { slug: 'growth-loops', emoji: '♾️', title: 'Петли роста', mode: 'proplus-loops', systemPrompt: 'Сконструируй 3 growth-loops под продукт, метрики входа/выхода и риски.' },
  { slug: 'okr-draft', emoji: '🎛️', title: 'Черновик OKR', mode: 'proplus-okr', systemPrompt: 'Сформируй 3–4 Objectives и 2–3 измеримых KR на каждую цель.' },
  { slug: 'feature-adoption', emoji: '📈', title: 'Усвоение фичи', mode: 'proplus-feature-adopt', systemPrompt: 'Идеи встраивания фичи в путь клиента: подсказки, пустые состояния, прогресс.' },
  { slug: 'community-strategy', emoji: '👥', title: 'Стратегия комьюнити', mode: 'proplus-community', systemPrompt: 'Роли, правила, темы, ритуалы, контент-план и промо-механики.' },
  { slug: 'investor-update', emoji: '💌', title: 'Письмо инвесторам', mode: 'proplus-investor', systemPrompt: 'Каркас письма: прогресс, метрики, риски, просьбы, планы. Две версии тона.' }
];
