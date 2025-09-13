// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Реюз клиента Prisma между перезагрузками модулей в dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Поддерживаем оба стиля импорта:
//   import prisma from '@/lib/prisma'
//   import { prisma } from '@/lib/prisma'
export default prisma;
