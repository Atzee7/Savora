import { OrderStatus, Prisma, Role } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../config/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/apiError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { dateTimeAtTime, scheduleToday } from '../../utils/schedule.js'
import { dbTimeToString, nowInAppZone, timeStringToDbDate } from '../../utils/time.js'

const router = Router()

router.use(authenticate, requireRole(Role.MERCHANT))

const storeInclude = {
  tiers: { orderBy: { price: 'asc' } },
  schedules: { orderBy: { pickupStart: 'asc' } },
} satisfies Prisma.StoreInclude

type MerchantStore = Prisma.StoreGetPayload<{ include: typeof storeInclude }>

function serializeStore(store: MerchantStore) {
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
    tiers: store.tiers.map((tier) => ({
      id: tier.id,
      name: tier.name,
      price: tier.price,
      minOriginalValue: tier.minOriginalValue,
      stock: tier.stock,
    })),
    totalStock: store.tiers.reduce((total, tier) => total + tier.stock, 0),
  }
}

async function findOwnStore(userId: string): Promise<MerchantStore> {
  const store = await prisma.store.findUnique({
    where: { userId },
    include: storeInclude,
  })

  if (!store) {
    throw new ApiError(404, 'Akun ini belum memiliki toko. Hubungi admin Savora.')
  }

  return store
}

const tierIdSchema = z.object({
  tierId: z.string().uuid('ID tier tidak valid.'),
})

const updateStockSchema = z
  .object({
    stock: z
      .number()
      .int('Stok harus bilangan bulat.')
      .min(0, 'Stok tidak boleh negatif.')
      .max(1000, 'Stok maksimal 1000 kantong per tier.'),
  })
  .strict()

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:mm.')

const updateScheduleSchema = z
  .object({
    pickupStart: timeSchema,
    pickupEnd: timeSchema,
  })
  .strict()
  .refine((data) => data.pickupEnd > data.pickupStart, {
    message: 'Jam pickup selesai harus setelah jam mulai.',
    path: ['pickupEnd'],
  })

const verifyPinSchema = z
  .object({
    pin: z.string().regex(/^\d{4}$/, 'PIN harus 4 digit angka.'),
  })
  .strict()

router.get(
  '/store',
  asyncHandler(async (req, res) => {
    const store = await findOwnStore(req.auth!.userId)
    res.json(serializeStore(store))
  }),
)

router.patch(
  '/tiers/:tierId',
  validate({ params: tierIdSchema, body: updateStockSchema }),
  asyncHandler(async (req, res) => {
    const { stock } = req.body as z.infer<typeof updateStockSchema>

    const tier = await prisma.tier.findFirst({
      where: {
        id: req.params.tierId,
        store: { userId: req.auth!.userId },
      },
      select: { id: true },
    })

    if (!tier) {
      throw new ApiError(404, 'Tier tidak ditemukan di toko kamu.')
    }

    const updated = await prisma.tier.update({
      where: { id: tier.id },
      data: { stock },
    })

    res.json({
      id: updated.id,
      name: updated.name,
      price: updated.price,
      minOriginalValue: updated.minOriginalValue,
      stock: updated.stock,
    })
  }),
)

router.put(
  '/schedule',
  validate({ body: updateScheduleSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof updateScheduleSchema>
    const store = await findOwnStore(req.auth!.userId)
    const existing = store.schedules[0]

    if (existing) {
      await prisma.storeSchedule.update({
        where: { id: existing.id },
        data: {
          pickupStart: timeStringToDbDate(body.pickupStart),
          pickupEnd: timeStringToDbDate(body.pickupEnd),
        },
      })
    } else {
      await prisma.storeSchedule.create({
        data: {
          storeId: store.id,
          pickupStart: timeStringToDbDate(body.pickupStart),
          pickupEnd: timeStringToDbDate(body.pickupEnd),
        },
      })
    }

    const refreshed = await findOwnStore(req.auth!.userId)
    res.json(serializeStore(refreshed))
  }),
)

router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const store = await findOwnStore(req.auth!.userId)
    const now = nowInAppZone()
    const dayStart = now.startOf('day').toJSDate()

    const [completed, activePickups, recentOrders] = await Promise.all([
      prisma.order.aggregate({
        where: {
          storeId: store.id,
          status: OrderStatus.COMPLETED,
          updatedAt: { gte: dayStart },
        },
        _count: { id: true },
        _sum: { qty: true, totalPrice: true },
      }),
      prisma.order.aggregate({
        where: {
          storeId: store.id,
          OR: [
            { status: OrderStatus.PAID, expiresAt: { gt: now.toJSDate() } },
            {
              status: OrderStatus.COMPLETED,
              updatedAt: { gte: dayStart },
            },
          ],
        },
        _sum: { qty: true },
      }),
      prisma.order.findMany({
        where: { storeId: store.id, createdAt: { gte: dayStart } },
        include: {
          customer: { select: { name: true } },
          tier: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const activeOrderCount = await prisma.order.count({
      where: {
        storeId: store.id,
        status: OrderStatus.PAID,
        expiresAt: { gt: now.toJSDate() },
      },
    })

    res.json({
      revenueToday: completed._sum.totalPrice ?? 0,
      completedToday: completed._count.id ?? 0,
      bagsToday: activePickups._sum.qty ?? 0,
      activePickups: activeOrderCount,
      totalStock: store.tiers.reduce((total, tier) => total + tier.stock, 0),
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customerName: order.customer.name,
        tierName: order.tier.name,
        qty: order.qty,
        totalPrice: order.totalPrice,
        status: order.status,
        expiresAt: order.expiresAt,
        createdAt: order.createdAt,
      })),
    })
  }),
)

router.post(
  '/verify-pin',
  validate({ body: verifyPinSchema }),
  asyncHandler(async (req, res) => {
    const { pin } = req.body as z.infer<typeof verifyPinSchema>
    const store = await findOwnStore(req.auth!.userId)
    const now = nowInAppZone()

    const order = await prisma.order.findFirst({
      where: { storeId: store.id, pinCode: pin },
      include: {
        customer: { select: { name: true } },
        tier: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!order) {
      throw new ApiError(404, 'PIN tidak ditemukan untuk toko ini.')
    }

    if (order.status === OrderStatus.COMPLETED) {
      throw new ApiError(409, 'PIN ini sudah digunakan dan pesanan sudah selesai.')
    }

    if (order.status === OrderStatus.EXPIRED || order.status === OrderStatus.CANCELLED) {
      throw new ApiError(409, 'Tiket ini sudah tidak aktif.')
    }

    if (order.status !== OrderStatus.PAID) {
      throw new ApiError(409, 'Pesanan belum dibayar, PIN belum aktif.')
    }

    if (!order.expiresAt || order.expiresAt <= now.toJSDate()) {
      await prisma.order.updateMany({
        where: {
          id: order.id,
          status: OrderStatus.PAID,
          expiresAt: { lte: now.toJSDate() },
        },
        data: { status: OrderStatus.EXPIRED },
      })
      throw new ApiError(409, 'Waktu pickup sudah lewat. Tiket kedaluwarsa.')
    }

    const schedule = scheduleToday(store.schedules)

    if (schedule) {
      const pickupStart = dateTimeAtTime(schedule.pickupStart, now)

      if (now < pickupStart) {
        throw new ApiError(
          409,
          `Jam pickup belum dimulai. Jadwal toko ${dbTimeToString(schedule.pickupStart)}–${dbTimeToString(schedule.pickupEnd)} WIB.`,
        )
      }
    }

    const completed = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PAID,
        expiresAt: { gt: now.toJSDate() },
      },
      data: { status: OrderStatus.COMPLETED },
    })

    if (completed.count === 0) {
      throw new ApiError(409, 'Status tiket sudah berubah. Muat ulang lalu coba lagi.')
    }

    res.json({
      orderId: order.id,
      customerName: order.customer.name,
      tierName: order.tier.name,
      qty: order.qty,
      totalPrice: order.totalPrice,
      completedAt: now.toISO(),
    })
  }),
)

export default router
