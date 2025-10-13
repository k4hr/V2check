// Берём первый символ, если это эмодзи (surrogate pair / ZWJ sequence не ломаем)
export function extractLeadingEmoji(s: string): string | null {
  const str = (s || '').trim();
  if (!str) return null;
  // простенькая эвристика: если первый символ — не буквенно-цифровой и не знак, вероятно эмодзи
  // оставим универсально: возьмём первый графемный кластер
  try {
    // @ts-ignore
    const seg = (Intl as any).Segmenter ? new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' }) : null;
    const first = seg ? seg.segment(str)[Symbol.iterator]().next().value?.segment : str[0];
    if (!first) return null;
    // если это обычная буква/цифра — вернём null
    if (/^[\p{L}\p{N}]$/u.test(first)) return null;
    return first;
  } catch {
    return null;
  }
}
