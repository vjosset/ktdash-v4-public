import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn']  // Show minimal logs in development
      : []                 // No logs in production
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
