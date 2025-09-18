// lib/catalog.ts
// Единое место: категории и список документов. Ссылки можно править тут.

export type Category = { slug: string; title: string; emoji: string; };
export type DocItem = {
  id: string;
  category: string;  // slug категории
  title: string;
  url: string;       // ссылка на документ (можно внешнюю)
  updatedAt?: string;
  emoji?: string;
};

export const CATEGORIES: Category[] = [
  { slug: 'constitution', title: 'Конституция РФ', emoji: '📜' },
  { slug: 'codes',        title: 'Кодексы РФ',     emoji: '⚖️' },
  { slug: 'statutes',     title: 'Уставы',         emoji: '📘' },
  { slug: 'pdd',          title: 'ПДД',            emoji: '🚗' },
  { slug: 'federal-laws', title: 'Федеральные законы', emoji: '🏛️' },
];

export const CATEGORIES_MAP = Object.fromEntries(CATEGORIES.map(c => [c.slug, c]));

export const DOCS: DocItem[] = [
  // Конституция
  {
    id: 'constitution-rf',
    category: 'constitution',
    title: 'Конституция Российской Федерации',
    url: 'https://www.consultant.ru/document/cons_doc_LAW_28399/',
    updatedAt: '2025-08-01',
    emoji: '📜',
  },

  // Кодексы (подраздел: все в одной категории "codes")
  { id: 'uk-rf', category: 'codes', title: 'Уголовный кодекс РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_10699/', updatedAt:'2025-07-10', emoji:'📕' },
  { id: 'koap-rf', category: 'codes', title: 'КоАП РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_34661/', updatedAt:'2025-07-01', emoji:'📕' },
  { id: 'gk-rf-1', category: 'codes', title: 'Гражданский кодекс РФ (ч.1)', url: 'https://www.consultant.ru/document/cons_doc_LAW_5142/', updatedAt:'2025-06-20', emoji:'📕' },
  { id: 'gk-rf-2', category: 'codes', title: 'Гражданский кодекс РФ (ч.2)', url: 'https://www.consultant.ru/document/cons_doc_LAW_5142/', updatedAt:'2025-06-20', emoji:'📕' },
  { id: 'trud-kodeks', category: 'codes', title: 'Трудовой кодекс РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_34683/', updatedAt:'2025-07-05', emoji:'📕' },
  { id: 'semeynyy-kodeks', category: 'codes', title: 'Семейный кодекс РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_8982/', updatedAt:'2025-07-05', emoji:'📕' },
  { id: 'nalog-kodeks', category: 'codes', title: 'Налоговый кодекс РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_19671/', updatedAt:'2025-06-30', emoji:'📕' },
  { id: 'zhil-kodeks', category: 'codes', title: 'Жилищный кодекс РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_51057/', updatedAt:'2025-07-01', emoji:'📕' },
  { id: 'gpk-rf', category: 'codes', title: 'ГПК РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_39570/', updatedAt:'2025-06-15', emoji:'📗' },
  { id: 'apk-rf', category: 'codes', title: 'АПК РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_37800/', updatedAt:'2025-06-10', emoji:'📗' },
  { id: 'upk-rf', category: 'codes', title: 'УПК РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_34481/', updatedAt:'2025-06-12', emoji:'📗' },

  // Уставы (пример)
  { id: 'ustav-vs', category: 'statutes', title: 'Устав Вооружённых Сил РФ', url: 'https://www.consultant.ru/document/cons_doc_LAW_21723/', updatedAt:'2025-05-01', emoji:'📘' },

  // ПДД
  { id: 'pdd', category: 'pdd', title: 'Правила дорожного движения', url: 'https://www.consultant.ru/document/cons_doc_LAW_2709/', updatedAt:'2025-04-01', emoji:'🚗' },

  // Федеральные законы (пример)
  { id: 'zpp', category: 'federal-laws', title: 'Закон «О защите прав потребителей»', url: 'https://www.consultant.ru/document/cons_doc_LAW_305/', updatedAt:'2025-08-01', emoji:'🏛️' },
  { id: '152-fz', category: 'federal-laws', title: 'Закон «О персональных данных»', url: 'https://www.consultant.ru/document/cons_doc_LAW_61801/', updatedAt:'2025-06-01', emoji:'🏛️' },
];

export function getDocsByCategory(slug: string): DocItem[] {
  return DOCS.filter(d => d.category === slug);
}

// ------- Лимиты 2/день (локально) -------
export const FREE_LIMIT = 2;

function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `jr.free.v1.${y}-${m}-${d}`;
}

export function getOpenedToday(): string[] {
  try {
    const raw = localStorage.getItem(dayKey());
    const arr = JSON.parse(raw || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function wasOpenedToday(id: string): boolean {
  return getOpenedToday().includes(id);
}

export function markOpenedToday(id: string) {
  try {
    const arr = Array.from(new Set([...getOpenedToday(), id]));
    localStorage.setItem(dayKey(), JSON.stringify(arr));
  } catch {}
}
