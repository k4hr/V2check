// proplus-tools.parts.ts — 2 части по 110 функций из полного списка PRO+
// Собираем из всех модулей Pro+ и делим на две части. Порядок сохраняется.

import { PROPLUS_FUNCTIONS } from './proplus-tools';
import { PROPLUS_FUNCTIONS_EXTRA } from './proplus-tools.extra';
import { PROPLUS_FUNCTIONS_EXTRA2 } from './proplus-tools.extra2';

const PROPLUS_FULL_ALL = [
  ...PROPLUS_FUNCTIONS,
  ...PROPLUS_FUNCTIONS_EXTRA,
  ...PROPLUS_FUNCTIONS_EXTRA2,
];

// Ровно 220 первых элементов (если есть столько)
const PROPLUS_220 = PROPLUS_FULL_ALL.slice(0, 220);

// Две части по 110
export const PROPLUS_FUNCTIONS_PART1 = PROPLUS_220.slice(0, 110);
export const PROPLUS_FUNCTIONS_PART2 = PROPLUS_220.slice(110, 220);

// Технические счётчики
export const PROPLUS_FUNCTIONS_TOTAL = PROPLUS_FULL_ALL.length;
export const PROPLUS_FUNCTIONS_USED = PROPLUS_220.length;
