// scripts/check-db-url.mjs — мягкая проверка БД, не роняет процесс
try {
  const url = process.env.DATABASE_URL || '';
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    console.warn('[WARN] DATABASE_URL не задан или не похож на postgres://. Сервис стартует без БД.');
    process.exitCode = 0; // не прерываем старт
  } else {
    console.log('[OK] DATABASE_URL обнаружен.');
  }
} catch (e) {
  console.warn('[WARN] check-db-url.mjs ошибка:', e?.message || e);
  process.exitCode = 0;
}
