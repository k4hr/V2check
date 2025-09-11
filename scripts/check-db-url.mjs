// scripts/check-db-url.mjs
// Мягкая проверка, чтобы Next не падал на prestart
const url = process.env.DATABASE_URL || '';
if (!url) {
  console.warn('[WARN] DATABASE_URL is empty. The app will run, but DB calls will fail.');
}
process.exit(0);
