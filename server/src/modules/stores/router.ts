import { Prisma, StoreStatus } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../config/prisma.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/apiError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { dbTimeToString } from '../../utils/time.js'

const router = Router()

type StoreWithRelations = Prisma.StoreGetPayload<{
  include: { schedules: true; tiers: true }
}>

function serializeStore(store: StoreWithRelations) {
  const tiers = [...store.tiers].sort((a, b) => a.price - b.price)

  return {
    id: store.id,
    storeName: store.storeName,
    address: store.address,
    latitude: store.latitude,
    longitude: store.longitude,
    status: store.status,
    schedules: store.schedules.map((schedule) => ({
      id: schedule.id,
      pickupStart: dbTimeToString(schedule.pickupStart),
      pickupEnd: dbTimeToString(schedule.pickupEnd),
    })),
    tiers: tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      minOriginalValue: tier.minOriginalValue,
      stock: tier.stock,
    })),
    totalStock: tiers.reduce((total, tier) => total + tier.stock, 0),
  }
}

const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
})

const storeIdSchema = z.object({
  id: z.string().uuid('ID toko tidak valid.'),
})

router.get(
  '/',
  validate({ query: listQuerySchema }),
  asyncHandler(async (req, res) => {
    const search = typeof req.query.q === 'string' ? req.query.q.trim() : ''

    const stores = await prisma.store.findMany({
      where: {
        status: StoreStatus.ACTIVE,
        tiers: { some: { stock: { gt: 0 } } },
        ...(search
          ? {
              OR: [
                { storeName: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        schedules: { orderBy: { pickupStart: 'asc' }, take: 1 },
        tiers: true,
      },
      orderBy: { storeName: 'asc' },
    })

    res.json(stores.map(serializeStore))
  }),
)

router.get(
  '/:id',
  validate({ params: storeIdSchema }),
  asyncHandler(async (req, res) => {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: {
        schedules: { orderBy: { pickupStart: 'asc' }, take: 1 },
        tiers: true,
      },
    })

    if (!store || store.status !== StoreStatus.ACTIVE) {
      throw new ApiError(404, 'Toko tidak ditemukan atau sedang tidak aktif.')
    }

    res.json(serializeStore(store))
  }),
)

export default router
