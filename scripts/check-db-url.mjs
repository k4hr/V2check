const ok = !!process.env.DATABASE_URL;
if (!ok) console.warn('[prestart] DATABASE_URL is not set. Prisma may fail to connect.');
