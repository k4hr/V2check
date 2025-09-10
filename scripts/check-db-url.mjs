// v2check/scripts/check-db-url.mjs
// Больше не логируем пароль/секреты. Только маска.
const raw = process.env.DATABASE_URL || '';
try {
  const u = new URL(raw);
  const masked =
    `${u.protocol}//` +
    `${u.username ? u.username + ':***@' : ''}` +
    `${u.hostname}` +
    `${u.port ? ':' + u.port : ''}` +
    `${u.pathname}`;
  console.log(`DATABASE_URL: ${masked || '(empty)'}`);
} catch {
  if (!raw) {
    console.warn('WARN: DATABASE_URL is empty.');
  } else {
    console.warn('WARN: DATABASE_URL format looks unusual.');
  }
}
