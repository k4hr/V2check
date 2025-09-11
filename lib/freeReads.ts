// lib/freeReads.ts
// Локальный лимит бесплатных открытий: 2 документа в сутки для не-PRO.
// Добавлены алиасы: remaining, canOpen, registerOpen (для совместимости).

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

/** Текущее количество использованных бесплатных открытий за сегодня */
export function getUsedToday(): number {
  const ls = safeLocalStorage();
  if (!ls) return 0;
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = ls.getItem(KEY_DATE);
  if (savedDate !== today) return 0;
  const cnt = parseInt(ls.getItem(KEY_COUNT) || '0', 10);
  return Number.isFinite(cnt) ? Math.max(0, cnt) : 0;
}

/** Сколько осталось бесплатных открытий */
export function getLeftToday(): number {
  return Math.max(0, DAILY_LIMIT - getUsedToday());
}

/** Зарегистрировать одно открытие (если есть свободное место) */
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

/* ==================== Алиасы для совместимости ==================== */

/** Осталось бесплатных открытий сегодня */
export function remaining(): number {
  return getLeftToday();
}

/** Можно ли открыть ещё один документ бесплатно */
export function canOpen(): boolean {
  return getLeftToday() > 0;
}

/** Регистрируем одно открытие (true/false по успеху) */
export function registerOpen(): boolean {
  const r = consumeOne();
  return !!r.ok;
}
