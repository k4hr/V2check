// lib/freeReads.ts
// Локальный лимит бесплатных открытий: 2 документа/сутки для не-PRO.
// Совместимость со старым кодом: canOpen(id, pro?) и registerOpen(id, pro?)

const KEY_DATE = 'jr_free_reads_date';
const KEY_COUNT = 'jr_free_reads_count';
const DAILY_LIMIT = 2;

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Сколько уже использовано сегодня */
export function getUsedToday(): number {
  const ls = safeLocalStorage();
  if (!ls) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = ls.getItem(KEY_DATE);
  if (savedDate !== today) return 0;
  const cnt = parseInt(ls.getItem(KEY_COUNT) || '0', 10);
  return Number.isFinite(cnt) ? Math.max(0, cnt) : 0;
}

/** Сколько осталось бесплатных открытий сегодня */
export function getLeftToday(): number {
  return Math.max(0, DAILY_LIMIT - getUsedToday());
}

/** Зарегистрировать одно открытие (если есть лимит) */
export function consumeOne(): { ok: boolean; left: number } {
  const ls = safeLocalStorage();
  if (!ls) return { ok: true, left: DAILY_LIMIT }; // на SSR не блокируем
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = ls.getItem(KEY_DATE);
  let cnt = 0;
  if (savedDate === today) {
    cnt = parseInt(ls.getItem(KEY_COUNT) || '0', 10) || 0;
  }
  if (cnt >= DAILY_LIMIT) return { ok: false, left: 0 };
  cnt += 1;
  ls.setItem(KEY_DATE, today);
  ls.setItem(KEY_COUNT, String(cnt));
  return { ok: true, left: Math.max(0, DAILY_LIMIT - cnt) };
}

/** Сбросить счётчик (на всякий случай) */
export function resetToday(): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  ls.removeItem(KEY_DATE);
  ls.removeItem(KEY_COUNT);
}

/** Ежедневный лимит (константа) */
export function dailyLimit(): number {
  return DAILY_LIMIT;
}

/* ==================== Совместимость со старым API ==================== */

/** Осталось бесплатных открытий; если pro===true — «без ограничений» */
export function remaining(pro?: boolean): number {
  if (pro) return 9999;
  return getLeftToday();
}

/**
 * Можно ли открыть документ бесплатно.
 * Совм. сигнатуры:
 *   canOpen(pro?: boolean)
 *   canOpen(id?: string, pro?: boolean)
 */
export function canOpen(a?: string | boolean, b?: boolean): boolean {
  const pro = typeof a === 'boolean' ? a : !!b;
  if (pro) return true;
  return getLeftToday() > 0;
}

/**
 * Регистрирует одно открытие.
 * Совм. сигнатуры:
 *   registerOpen(pro?: boolean)
 *   registerOpen(id?: string, pro?: boolean)
 */
export function registerOpen(a?: string | boolean, b?: boolean): boolean {
  const pro = typeof a === 'boolean' ? a : !!b;
  if (pro) return true;
  const r = consumeOne();
  return !!r.ok;
}
