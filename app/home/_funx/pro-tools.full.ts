// pro-tools.full.ts — единый файл для тарифа PRO (gpt-4o-mini).
// Собирает ВСЕ 240 функций из: pro-tools.ts, pro-tools.extra.ts, pro-tools.extra2.ts
// Экспортирует единый массив с функциями без пропусков.
//
// Если пути отличаются — поправьте import-строки ниже.

import { PRO_FUNCTIONS as PRO_BASE } from './pro-tools';
import { PRO_FUNCTIONS_EXTRA as PRO_EXTRA } from './pro-tools.extra';
import { PRO_FUNCTIONS_EXTRA2 as PRO_EXTRA2 } from './pro-tools.extra2';

// Прямое разворачивание в литеральный массив (без ссылок), чтобы получилось «как в файле».
export const PRO_FUNCTIONS = [
  ...PRO_BASE,
  ...PRO_EXTRA,
  ...PRO_EXTRA2,
];

export const PRO_FUNCTIONS_COUNT = PRO_FUNCTIONS.length; // ожидается 240
