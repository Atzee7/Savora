import { Router } from 'express'

import { prisma } from '../../config/prisma.js'
import { asyncHandler } from '../../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let database: 'up' | 'down' = 'up'

    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      database = 'down'
    }

    res.json({
      status: 'ok',
      service: 'savora-api',
      database,
      timestamp: new Date().toISOString(),
    })
  }),
)

export default router
