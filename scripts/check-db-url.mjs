// scripts/check-db-url.mjs
if (!process.env.DATABASE_URL) {
  console.warn('[WARN] DATABASE_URL is not set');
  process.exit(0);
}
