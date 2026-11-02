import { Prisma } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../config/prisma.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/apiError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { upcomingScheduleToday } from '../../utils/schedule.js'
import { OPERATIONAL_STORE_STATUSES } from '../../utils/storeStatus.js'
import { dbTimeToString } from '../../utils/time.js'

const router = Router()

type StoreWithRelations = Prisma.StoreGetPayload<{
  include: { schedules: true; tiers: true }
}>

type ScheduleRow = StoreWithRelations['schedules'][number]

function serializeStore(store: StoreWithRelations, schedules: ScheduleRow[] = store.schedules) {
  const tiers = [...store.tiers].sort((a, b) => a.price - b.price)

  return {
    id: store.id,
    storeName: store.storeName,
    address: store.address,
    latitude: store.latitude,
    longitude: store.longitude,
    status: store.status,
    schedules: schedules.map((schedule) => ({
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
        status: { in: OPERATIONAL_STORE_STATUSES },
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
        schedules: { orderBy: { pickupStart: 'asc' } },
        tiers: true,
      },
      orderBy: { storeName: 'asc' },
    })

    const visible = stores.flatMap((store) => {
      const schedule = upcomingScheduleToday(store.schedules)
      return schedule ? [serializeStore(store, [schedule])] : []
    })

    res.json(visible)
  }),
)

router.get(
  '/:id',
  validate({ params: storeIdSchema }),
  asyncHandler(async (req, res) => {
    const store = await prisma.store.findUnique({
      where: { id: req.params.id },
      include: {
        schedules: { orderBy: { pickupStart: 'asc' } },
        tiers: true,
      },
    })

    if (!store || !OPERATIONAL_STORE_STATUSES.includes(store.status)) {
      throw new ApiError(404, 'Toko tidak ditemukan atau sedang tidak aktif.')
    }

    const schedule = upcomingScheduleToday(store.schedules)

    if (!schedule) {
      throw new ApiError(404, 'Toko sedang tutup. Jadwal pickup hari ini sudah lewat.')
    }

    res.json(serializeStore(store, [schedule]))
  }),
)

export default router
