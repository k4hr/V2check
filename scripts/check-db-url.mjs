// scripts/check-db-url.mjs — мягкая проверка ENV перед start
if (!process.env.DATABASE_URL) {
  console.warn('[prestart] DATABASE_URL is not set. Prisma may fail to connect.');
}
