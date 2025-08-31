// Lightweight Prisma client with hot-reload guard for Next.js
import { PrismaClient } from '@prisma/client'

// Prevent multiple instances in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'info', 'warn', 'error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
