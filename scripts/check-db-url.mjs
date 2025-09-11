// scripts/check-db-url.mjs
// Проверяет валидность DATABASE_URL, НО НЕ ПАДАЕТ даже при ошибке.
// Это важно, чтобы процесс на Railway не умирал на старте.

try {
  const url = process.env.DATABASE_URL || '';
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    console.warn(
      '[WARN] DATABASE_URL не задан или не похож на postgres://. ' +
      'Сервис стартует, но все запросы к БД вернут ошибку до настройки переменной.'
    );
    process.exitCode = 0; // мягкий выход
  } else {
    console.log('[OK] DATABASE_URL обнаружен.');
  }
} catch (e) {
  console.warn('[WARN] check-db-url.mjs ошибка:', e?.message || e);
  process.exitCode = 0;
}
