import { PrismaClient } from '@prisma/client'

import { env } from './env.js'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

/**
 * Client di-cache di globalThis untuk semua environment.
 * Di serverless, container dipakai ulang antar request, jadi tanpa cache
 * setiap request membuka koneksi baru ke pooler database.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

globalForPrisma.prisma = prisma
