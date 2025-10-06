// proplus-tools.full.ts — единый файл для тарифа PRO+ (gpt-4o).
// Собирает ВСЕ 220 функций из: proplus-tools.ts, proplus-tools.extra.ts, proplus-tools.extra2.ts
// Экспортирует единый массив с функциями без пропусков.
//
// Если пути отличаются — поправьте import-строки ниже.

import { PROPLUS_FUNCTIONS as PROPLUS_BASE } from './proplus-tools';
import { PROPLUS_FUNCTIONS_EXTRA as PROPLUS_EXTRA } from './proplus-tools.extra';
import { PROPLUS_FUNCTIONS_EXTRA2 as PROPLUS_EXTRA2 } from './proplus-tools.extra2';

// Прямое разворачивание в единый литеральный массив.
export const PROPLUS_FUNCTIONS = [
  ...PROPLUS_BASE,
  ...PROPLUS_EXTRA,
  ...PROPLUS_EXTRA2,
];

export const PROPLUS_FUNCTIONS_COUNT = PROPLUS_FUNCTIONS.length; // ожидается 220
