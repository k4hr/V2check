// app/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// В dev переиспользуем инстанс между перезапусками модулей
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

// Кэшируем только в деве
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Поддерживаем оба варианта импорта:
//   import prisma from '@/lib/prisma'
//   import { prisma } from '@/lib/prisma'
export default prisma;
