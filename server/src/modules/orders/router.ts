import { OrderStatus, Prisma, Role, StoreStatus } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../config/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/apiError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { closePendingOrder, expireOverduePendingOrders } from '../../utils/orderLifecycle.js'
import { generatePin } from '../../utils/pin.js'
import { dateTimeAtTime, scheduleToday, upcomingScheduleToday } from '../../utils/schedule.js'
import { OPERATIONAL_STORE_STATUSES } from '../../utils/storeStatus.js'
import { dbTimeToString, nowInAppZone } from '../../utils/time.js'

const router = Router()

const MAX_BAGS_PER_ORDER = 2
const PAYMENT_WINDOW_MINUTES = 15

const orderInclude = {
  store: { include: { schedules: true } },
  tier: true,
  audit: { select: { isSatisfied: true, comment: true, createdAt: true } },
} satisfies Prisma.OrderInclude

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>

function serializeOrder(order: OrderWithRelations) {
  const schedule = scheduleToday(order.store.schedules)

  return {
    id: order.id,
    customerId: order.customerId,
    storeId: order.storeId,
    tierId: order.tierId,
    qty: order.qty,
    totalPrice: order.totalPrice,
    status: order.status,
    pinCode: order.pinCode,
    expiresAt: order.expiresAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    store: {
      id: order.store.id,
      storeName: order.store.storeName,
      address: order.store.address,
      latitude: order.store.latitude,
      longitude: order.store.longitude,
    },
    tier: {
      id: order.tier.id,
      name: order.tier.name,
      price: order.tier.price,
      minOriginalValue: order.tier.minOriginalValue,
    },
    schedule: schedule
      ? {
          pickupStart: dbTimeToString(schedule.pickupStart),
          pickupEnd: dbTimeToString(schedule.pickupEnd),
        }
      : null,
    feedback: order.audit
      ? {
          isSatisfied: order.audit.isSatisfied,
          comment: order.audit.comment,
          createdAt: order.audit.createdAt,
        }
      : null,
  }
}

async function dailyUsedQty(customerId: string, storeId: string): Promise<number> {
  const now = nowInAppZone()
  const dayStart = now.startOf('day').toJSDate()

  const result = await prisma.order.aggregate({
    where: {
      customerId,
      storeId,
      createdAt: { gte: dayStart },
      OR: [
        { status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] } },
        { status: OrderStatus.PENDING, expiresAt: { gt: now.toJSDate() } },
      ],
    },
    _sum: { qty: true },
  })

  return result._sum.qty ?? 0
}

async function generateUniquePin(): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pin = generatePin()
    const existing = await prisma.order.findFirst({
      where: {
        pinCode: pin,
        status: { in: [OrderStatus.PAID, OrderStatus.COMPLETED] },
      },
      select: { id: true },
    })

    if (!existing) {
      return pin
    }
  }

  throw new ApiError(503, 'PIN unik belum bisa dibuat. Coba lagi beberapa saat.')
}

/** Menandai toko WARNING jika rasio ulasan "tidak sesuai" melebihi 20%. */
async function applyStoreWarning(storeId: string): Promise<void> {
  const [total, unsatisfied] = await Promise.all([
    prisma.orderAudit.count({ where: { order: { storeId } } }),
    prisma.orderAudit.count({ where: { isSatisfied: false, order: { storeId } } }),
  ])

  if (total > 0 && unsatisfied / total > 0.2) {
    await prisma.store.updateMany({
      where: { id: storeId, status: StoreStatus.ACTIVE },
      data: { status: StoreStatus.WARNING },
    })
  }
}

const tierIdSchema = z.object({
  tierId: z.string().uuid('ID tier tidak valid.'),
})

const orderIdSchema = z.object({
  id: z.string().uuid('ID pesanan tidak valid.'),
})

const createOrderSchema = z
  .object({
    tierId: z.string().uuid('ID tier tidak valid.'),
    qty: z
      .number()
      .int('Jumlah kantong harus bilangan bulat.')
      .min(1, 'Minimal 1 kantong.')
      .max(MAX_BAGS_PER_ORDER, `Maksimal ${MAX_BAGS_PER_ORDER} kantong per transaksi.`),
  })
  .strict()

const feedbackSchema = z
  .object({
    isSatisfied: z.boolean(),
    comment: z
      .string()
      .trim()
      .max(1000, 'Komentar maksimal 1000 karakter.')
      .optional()
      .transform((value) => value || null),
  })
  .strict()

router.use(authenticate)

router.get(
  '/checkout/:tierId',
  requireRole(Role.CUSTOMER),
  validate({ params: tierIdSchema }),
  asyncHandler(async (req, res) => {
    const tier = await prisma.tier.findUnique({
      where: { id: req.params.tierId },
      include: { store: { include: { schedules: true } } },
    })

    if (!tier || !OPERATIONAL_STORE_STATUSES.includes(tier.store.status)) {
      throw new ApiError(404, 'Tier atau toko tidak ditemukan.')
    }

    const schedule = upcomingScheduleToday(tier.store.schedules)

    if (!schedule) {
      throw new ApiError(409, 'Jadwal pickup toko sudah lewat untuk hari ini.')
    }

    const used = await dailyUsedQty(req.auth!.userId, tier.storeId)

    res.json({
      tier: {
        id: tier.id,
        name: tier.name,
        price: tier.price,
        minOriginalValue: tier.minOriginalValue,
        stock: tier.stock,
      },
      store: {
        id: tier.store.id,
        storeName: tier.store.storeName,
        address: tier.store.address,
        latitude: tier.store.latitude,
        longitude: tier.store.longitude,
      },
      schedule: {
        pickupStart: dbTimeToString(schedule.pickupStart),
        pickupEnd: dbTimeToString(schedule.pickupEnd),
      },
      maxQty: MAX_BAGS_PER_ORDER,
      remainingQty: Math.max(0, MAX_BAGS_PER_ORDER - used),
    })
  }),
)

router.post(
  '/',
  requireRole(Role.CUSTOMER),
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const { tierId, qty } = req.body as z.infer<typeof createOrderSchema>
    const now = nowInAppZone()

    const tier = await prisma.tier.findUnique({
      where: { id: tierId },
      include: { store: { include: { schedules: true } } },
    })

    if (!tier || !OPERATIONAL_STORE_STATUSES.includes(tier.store.status)) {
      throw new ApiError(404, 'Tier atau toko tidak ditemukan atau sedang tidak aktif.')
    }

    const schedule = upcomingScheduleToday(tier.store.schedules)

    if (!schedule) {
      throw new ApiError(409, 'Jadwal pickup toko sudah lewat untuk hari ini.')
    }

    const used = await dailyUsedQty(req.auth!.userId, tier.storeId)
    const remaining = Math.max(0, MAX_BAGS_PER_ORDER - used)

    if (qty > remaining) {
      throw new ApiError(
        409,
        remaining === 0
          ? `Kamu sudah mencapai batas ${MAX_BAGS_PER_ORDER} kantong di toko ini hari ini.`
          : `Sisa kuota kamu di toko ini hari ini: ${remaining} kantong.`,
      )
    }

    if (tier.stock < qty) {
      throw new ApiError(409, 'Stok kantong tidak mencukupi. Silakan pilih tier lain.')
    }

    const pickupEnd = dateTimeAtTime(schedule.pickupEnd, now)
    const paymentDeadline = now.plus({ minutes: PAYMENT_WINDOW_MINUTES })
    const expiresAt = paymentDeadline < pickupEnd ? paymentDeadline : pickupEnd

    const order = await prisma.$transaction(async (tx) => {
      const reserved = await tx.tier.updateMany({
        where: { id: tier.id, stock: { gte: qty } },
        data: { stock: { decrement: qty } },
      })

      if (reserved.count === 0) {
        throw new ApiError(409, 'Stok kantong tidak mencukupi. Silakan pilih tier lain.')
      }

      return tx.order.create({
        data: {
          customerId: req.auth!.userId,
          storeId: tier.storeId,
          tierId: tier.id,
          qty,
          totalPrice: tier.price * qty,
          status: OrderStatus.PENDING,
          expiresAt: expiresAt.toJSDate(),
        },
        include: orderInclude,
      })
    })

    res.status(201).json(serializeOrder(order))
  }),
)

router.get(
  '/mine',
  requireRole(Role.CUSTOMER),
  asyncHandler(async (req, res) => {
    await expireOverduePendingOrders(req.auth!.userId)

    const orders = await prisma.order.findMany({
      where: { customerId: req.auth!.userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    })

    res.json(orders.map(serializeOrder))
  }),
)

router.get(
  '/:id',
  validate({ params: orderIdSchema }),
  asyncHandler(async (req, res) => {
    let order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    })

    if (!order) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    const canAccess =
      req.auth!.role === Role.ADMIN ||
      (req.auth!.role === Role.CUSTOMER && order.customerId === req.auth!.userId)

    if (!canAccess) {
      throw new ApiError(403, 'Kamu tidak punya akses ke pesanan ini.')
    }

    if (
      order.status === OrderStatus.PENDING &&
      order.expiresAt &&
      order.expiresAt <= new Date()
    ) {
      await closePendingOrder(order.id, OrderStatus.EXPIRED)
      order = await prisma.order.findUnique({
        where: { id: order.id },
        include: orderInclude,
      })
    }

    if (!order) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    res.json(serializeOrder(order))
  }),
)

router.post(
  '/:id/pay',
  requireRole(Role.CUSTOMER),
  validate({ params: orderIdSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    })

    if (!order || order.customerId !== req.auth!.userId) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    if (order.status === OrderStatus.PAID) {
      throw new ApiError(409, 'Pesanan ini sudah dibayar.')
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ApiError(409, 'Pesanan ini tidak bisa dibayar lagi.')
    }

    const now = nowInAppZone()

    if (!order.expiresAt || order.expiresAt <= now.toJSDate()) {
      await closePendingOrder(order.id, OrderStatus.EXPIRED)
      throw new ApiError(409, 'Waktu pembayaran sudah habis. Silakan buat pesanan baru.')
    }

    const schedule = upcomingScheduleToday(order.store.schedules)

    if (!schedule) {
      await closePendingOrder(order.id, OrderStatus.EXPIRED)
      throw new ApiError(409, 'Jadwal pickup toko sudah lewat. Pesanan dibatalkan.')
    }

    const pickupEnd = dateTimeAtTime(schedule.pickupEnd, now)

    if (pickupEnd <= now) {
      await closePendingOrder(order.id, OrderStatus.EXPIRED)
      throw new ApiError(409, 'Jadwal pickup toko sudah lewat. Pesanan dibatalkan.')
    }

    const pinCode = await generateUniquePin()
    const updated = await prisma.order.updateMany({
      where: {
        id: order.id,
        status: OrderStatus.PENDING,
        expiresAt: { gt: now.toJSDate() },
      },
      data: {
        status: OrderStatus.PAID,
        pinCode,
        expiresAt: pickupEnd.toJSDate(),
      },
    })

    if (updated.count === 0) {
      throw new ApiError(409, 'Pesanan sudah berubah. Muat ulang halaman lalu coba lagi.')
    }

    const paid = await prisma.order.findUnique({
      where: { id: order.id },
      include: orderInclude,
    })

    if (!paid) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    res.json(serializeOrder(paid))
  }),
)

router.post(
  '/:id/cancel',
  requireRole(Role.CUSTOMER),
  validate({ params: orderIdSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    })

    if (!order || order.customerId !== req.auth!.userId) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new ApiError(409, 'Hanya pesanan yang belum dibayar yang bisa dibatalkan.')
    }

    if (order.expiresAt && order.expiresAt <= new Date()) {
      await closePendingOrder(order.id, OrderStatus.EXPIRED)
      throw new ApiError(409, 'Pesanan sudah kedaluwarsa sebelum dibatalkan.')
    }

    const closed = await closePendingOrder(order.id, OrderStatus.CANCELLED)

    if (!closed) {
      throw new ApiError(409, 'Pesanan tidak bisa dibatalkan. Muat ulang halaman lalu coba lagi.')
    }

    const cancelled = await prisma.order.findUnique({
      where: { id: order.id },
      include: orderInclude,
    })

    if (!cancelled) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    res.json(serializeOrder(cancelled))
  }),
)

router.post(
  '/:id/feedback',
  requireRole(Role.CUSTOMER),
  validate({ params: orderIdSchema, body: feedbackSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof feedbackSchema>

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    })

    if (!order || order.customerId !== req.auth!.userId) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    if (order.status !== OrderStatus.COMPLETED) {
      throw new ApiError(409, 'Ulasan hanya bisa dikirim setelah pesanan selesai.')
    }

    if (order.audit) {
      throw new ApiError(409, 'Ulasan untuk pesanan ini sudah dikirim.')
    }

    await prisma.orderAudit.create({
      data: {
        orderId: order.id,
        isSatisfied: body.isSatisfied,
        comment: body.comment,
      },
    })

    await applyStoreWarning(order.storeId)

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: orderInclude,
    })

    if (!updated) {
      throw new ApiError(404, 'Pesanan tidak ditemukan.')
    }

    res.status(201).json(serializeOrder(updated))
  }),
)

export default router
