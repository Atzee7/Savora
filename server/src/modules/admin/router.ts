import { OrderStatus, Prisma, Role, StoreStatus } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../config/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { requireRole } from '../../middleware/requireRole.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/apiError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { hashPassword } from '../../utils/password.js'
import { DEFAULT_TIERS } from '../../utils/tiers.js'
import { dbTimeToString, nowInAppZone, timeStringToDbDate } from '../../utils/time.js'

const router = Router()

router.use(authenticate, requireRole(Role.ADMIN))

type MerchantWithStore = Prisma.UserGetPayload<{
  include: { store: { include: { tiers: true; schedules: true } } }
}>

function serializeMerchant(user: MerchantWithStore) {
  const store = user.store
  const tiers = store ? [...store.tiers].sort((a, b) => a.price - b.price) : []

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    store: store
      ? {
          id: store.id,
          storeName: store.storeName,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
          status: store.status,
          schedules: store.schedules
            .map((schedule) => ({
              id: schedule.id,
              pickupStart: dbTimeToString(schedule.pickupStart),
              pickupEnd: dbTimeToString(schedule.pickupEnd),
            }))
            .sort((a, b) => a.pickupStart.localeCompare(b.pickupStart)),
          tiers: tiers.map((tier) => ({
            id: tier.id,
            name: tier.name,
            price: tier.price,
            minOriginalValue: tier.minOriginalValue,
            stock: tier.stock,
          })),
          totalStock: tiers.reduce((total, tier) => total + tier.stock, 0),
        }
      : null,
  }
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Format email tidak valid.')
  .max(160, 'Email maksimal 160 karakter.')

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format jam harus HH:mm.')

const createMerchantSchema = z
  .object({
    ownerName: z
      .string()
      .trim()
      .min(2, 'Nama pemilik minimal 2 karakter.')
      .max(120, 'Nama pemilik maksimal 120 karakter.'),
    email: emailSchema,
    phone: z
      .string()
      .trim()
      .max(30, 'Nomor telepon maksimal 30 karakter.')
      .regex(/^[0-9+\-\s()]*$/, 'Nomor telepon hanya boleh berisi angka, spasi, dan tanda + - ( ).')
      .optional()
      .transform((value) => value || null),
    password: z
      .string()
      .min(8, 'Password awal minimal 8 karakter.')
      .max(72, 'Password awal maksimal 72 karakter.'),
    storeName: z
      .string()
      .trim()
      .min(2, 'Nama toko minimal 2 karakter.')
      .max(160, 'Nama toko maksimal 160 karakter.'),
    address: z
      .string()
      .trim()
      .min(10, 'Alamat minimal 10 karakter.')
      .max(1000, 'Alamat maksimal 1000 karakter.'),
    latitude: z.coerce.number().min(-90, 'Latitude tidak valid.').max(90, 'Latitude tidak valid.'),
    longitude: z.coerce
      .number()
      .min(-180, 'Longitude tidak valid.')
      .max(180, 'Longitude tidak valid.'),
    pickupStart: timeSchema,
    pickupEnd: timeSchema,
  })
  .refine((data) => data.pickupEnd > data.pickupStart, {
    message: 'Jam pickup selesai harus setelah jam mulai.',
    path: ['pickupEnd'],
  })

const storeIdSchema = z.object({
  storeId: z.string().uuid('ID toko tidak valid.'),
})

const updateStoreStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'WARNING', 'SUSPENDED']),
  })
  .strict()

type FeedbackSummary = {
  total: number
  unsatisfied: number
  rate: number
}

function summarizeFeedback(audits: { isSatisfied: boolean }[]): FeedbackSummary {
  const total = audits.length
  const unsatisfied = audits.filter((audit) => !audit.isSatisfied).length

  return {
    total,
    unsatisfied,
    rate: total === 0 ? 0 : Math.round((unsatisfied / total) * 1000) / 10,
  }
}

router.get(
  '/merchants',
  asyncHandler(async (_req, res) => {
    const merchants = await prisma.user.findMany({
      where: { role: Role.MERCHANT },
      include: {
        store: {
          include: {
            tiers: true,
            schedules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(merchants.map(serializeMerchant))
  }),
)

router.post(
  '/merchants',
  validate({ body: createMerchantSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createMerchantSchema>

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } })

    if (existingUser) {
      throw new ApiError(409, 'Email sudah terdaftar. Gunakan email lain untuk akun mitra.')
    }

    const passwordHash = await hashPassword(body.password)

    const merchant = await prisma.user.create({
      data: {
        name: body.ownerName,
        email: body.email,
        phone: body.phone,
        passwordHash,
        role: Role.MERCHANT,
        store: {
          create: {
            storeName: body.storeName,
            address: body.address,
            latitude: body.latitude,
            longitude: body.longitude,
            status: StoreStatus.ACTIVE,
            schedules: {
              create: {
                pickupStart: timeStringToDbDate(body.pickupStart),
                pickupEnd: timeStringToDbDate(body.pickupEnd),
              },
            },
            tiers: {
              create: DEFAULT_TIERS.map((tier) => ({
                name: tier.name,
                price: tier.price,
                minOriginalValue: tier.minOriginalValue,
                stock: 0,
              })),
            },
          },
        },
      },
      include: {
        store: {
          include: {
            tiers: true,
            schedules: true,
          },
        },
      },
    })

    res.status(201).json(serializeMerchant(merchant))
  }),
)

router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const now = nowInAppZone()
    const dayStart = now.startOf('day').toJSDate()

    const [totalMerchants, totalCustomers, stores, audits, ordersToday, completedToday, recentOrders] =
      await Promise.all([
        prisma.user.count({ where: { role: Role.MERCHANT } }),
        prisma.user.count({ where: { role: Role.CUSTOMER } }),
        prisma.store.findMany({
          include: {
            user: { select: { name: true, email: true } },
            tiers: { select: { stock: true } },
          },
          orderBy: { storeName: 'asc' },
        }),
        prisma.orderAudit.findMany({
          select: { isSatisfied: true, order: { select: { storeId: true } } },
        }),
        prisma.order.count({ where: { createdAt: { gte: dayStart } } }),
        prisma.order.aggregate({
          where: { status: OrderStatus.COMPLETED, updatedAt: { gte: dayStart } },
          _count: { id: true },
          _sum: { totalPrice: true },
        }),
        prisma.order.findMany({
          include: {
            customer: { select: { name: true } },
            store: { select: { storeName: true } },
            tier: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])

    const auditsByStore = new Map<string, { isSatisfied: boolean }[]>()

    for (const audit of audits) {
      const storeId = audit.order.storeId
      const current = auditsByStore.get(storeId) ?? []
      current.push({ isSatisfied: audit.isSatisfied })
      auditsByStore.set(storeId, current)
    }

    const storeSummaries = stores.map((store) => ({
      id: store.id,
      storeName: store.storeName,
      address: store.address,
      status: store.status,
      ownerName: store.user.name,
      ownerEmail: store.user.email,
      totalStock: store.tiers.reduce((total, tier) => total + tier.stock, 0),
      feedback: summarizeFeedback(auditsByStore.get(store.id) ?? []),
    }))

    const flaggedStores = storeSummaries
      .filter((store) => store.status === StoreStatus.WARNING || store.status === StoreStatus.SUSPENDED)
      .sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === StoreStatus.WARNING ? -1 : 1
        }

        return b.feedback.rate - a.feedback.rate
      })

    const globalFeedback = summarizeFeedback(audits)

    res.json({
      stats: {
        totalMerchants,
        totalCustomers,
        totalStores: stores.length,
        activeStores: storeSummaries.filter((store) => store.status === StoreStatus.ACTIVE).length,
        warningStores: storeSummaries.filter((store) => store.status === StoreStatus.WARNING).length,
        suspendedStores: storeSummaries.filter((store) => store.status === StoreStatus.SUSPENDED).length,
        totalStock: storeSummaries.reduce((total, store) => total + store.totalStock, 0),
        ordersToday,
        completedToday: completedToday._count.id ?? 0,
        revenueToday: completedToday._sum.totalPrice ?? 0,
        feedbackTotal: globalFeedback.total,
        unsatisfiedCount: globalFeedback.unsatisfied,
        unsatisfiedRate: globalFeedback.rate,
      },
      flaggedStores,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        customerName: order.customer.name,
        storeName: order.store.storeName,
        tierName: order.tier.name,
        qty: order.qty,
        totalPrice: order.totalPrice,
        status: order.status,
        createdAt: order.createdAt,
      })),
    })
  }),
)

router.patch(
  '/stores/:storeId/status',
  validate({ params: storeIdSchema, body: updateStoreStatusSchema }),
  asyncHandler(async (req, res) => {
    const { status } = req.body as z.infer<typeof updateStoreStatusSchema>

    const store = await prisma.store.findUnique({
      where: { id: req.params.storeId },
      select: { id: true },
    })

    if (!store) {
      throw new ApiError(404, 'Toko tidak ditemukan.')
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { status },
      select: { id: true, storeName: true, status: true },
    })

    res.json(updated)
  }),
)

export default router
