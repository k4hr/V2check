// v2check/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

/**
 * Единый Prisma-клиент:
 * - именованный экспорт `prisma`
 * - и экспорт по умолчанию (для совместимости со старым кодом)
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
