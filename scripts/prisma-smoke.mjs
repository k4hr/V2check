// scripts/prisma-smoke.mjs
// Быстрый прогон на проде — проверяет, что Prisma подцепил правильный движок
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
try {
  const now = new Date();
  // Лёгкий запрос, не меняющий данные (SELECT 1 эквивалент)
  const users = await prisma.user.findMany({ take: 1, select: { id: true } });
  console.log(JSON.stringify({ ok: true, sample: users.length, ts: now.toISOString() }));
  process.exit(0);
} catch (e) {
  console.error('SMOKE_ERROR:', e?.message || e);
  process.exit(1);
} finally {
  await prisma.$disconnect().catch(()=>{});
}
