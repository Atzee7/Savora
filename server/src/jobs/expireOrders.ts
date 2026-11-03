import cron from 'node-cron'

import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { expireOverduePendingOrders } from '../utils/orderLifecycle.js'

export type ExpireResult = {
  pending: number
  paid: number
}

/**
 * Menutup order yang sudah lewat batas:
 *  - PENDING yang lewat batas bayar menjadi EXPIRED dan stoknya dikembalikan.
 *  - PAID yang melewati batas pickup menjadi EXPIRED (no refund).
 */
export async function processExpiredOrders(): Promise<ExpireResult> {
  const pending = await expireOverduePendingOrders()

  const paid = await prisma.order.updateMany({
    where: {
      status: 'PAID',
      expiresAt: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  })

  return { pending, paid: paid.count }
}

const LAZY_INTERVAL_MS = 60_000
let lastLazyRun = 0

/**
 * Pengganti cron di lingkungan serverless: dipanggil dari middleware dan
 * dibatasi maksimal sekali per menit per instance.
 */
export async function runLazyExpireOrders(): Promise<void> {
  const now = Date.now()

  if (now - lastLazyRun < LAZY_INTERVAL_MS) {
    return
  }

  lastLazyRun = now

  try {
    const { pending, paid } = await processExpiredOrders()

    if (pending > 0 || paid > 0) {
      console.log(
        `[jobs] ${pending} pesanan PENDING dibatalkan, ${paid} pesanan PAID kedaluwarsa.`,
      )
    }
  } catch (error) {
    console.error('[jobs] Gagal memproses pesanan kedaluwarsa:', error)
  }
}

export function startExpireOrdersJob(): void {
  if (env.NODE_ENV === 'test') {
    return
  }

  cron.schedule(
    '* * * * *',
    async () => {
      try {
        const { pending, paid } = await processExpiredOrders()

        if (pending > 0 || paid > 0) {
          console.log(
            `[jobs] ${pending} pesanan PENDING dibatalkan, ${paid} pesanan PAID kedaluwarsa.`,
          )
        }
      } catch (error) {
        console.error('[jobs] Gagal memproses pesanan kedaluwarsa:', error)
      }
    },
    { timezone: 'Asia/Jakarta' },
  )

  console.log('[jobs] expire-orders aktif (setiap menit).')
}
