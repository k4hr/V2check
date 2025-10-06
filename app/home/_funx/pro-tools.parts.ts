// pro-tools.parts.ts — 2 части по 120 функций из полного списка PRO
// Ничего не теряем: собираем единый массив из исходных модулей и делим на две части.
// Если элементов больше 240 — возьмём первые 240; если меньше — отдадим всё, сохраняя порядок.

import { PRO_FUNCTIONS } from './pro-tools';
import { PRO_FUNCTIONS_EXTRA } from './pro-tools.extra';
import { PRO_FUNCTIONS_EXTRA2 } from './pro-tools.extra2';

const PRO_FULL_ALL = [
  ...PRO_FUNCTIONS,
  ...PRO_FUNCTIONS_EXTRA,
  ...PRO_FUNCTIONS_EXTRA2,
];

// Ровно 240 первых элементов в стабильном порядке (если есть столько)
const PRO_240 = PRO_FULL_ALL.slice(0, 240);

// Две части по 120
export const PRO_FUNCTIONS_PART1 = PRO_240.slice(0, 120);
export const PRO_FUNCTIONS_PART2 = PRO_240.slice(120, 240);

// На всякий случай экспортируем технические счётчики
export const PRO_FUNCTIONS_TOTAL = PRO_FULL_ALL.length;
export const PRO_FUNCTIONS_USED = PRO_240.length;
