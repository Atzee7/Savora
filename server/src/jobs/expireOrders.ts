import cron from 'node-cron'

import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'
import { expireOverduePendingOrders } from '../utils/orderLifecycle.js'

/**
 * Setiap menit:
 *  - order PENDING yang lewat batas bayar menjadi EXPIRED dan stoknya dikembalikan.
 *  - order PAID yang melewati batas pickup menjadi EXPIRED (no refund).
 */
export function startExpireOrdersJob(): void {
  if (env.NODE_ENV === 'test') {
    return
  }

  cron.schedule(
    '* * * * *',
    async () => {
      try {
        const pending = await expireOverduePendingOrders()

        const paid = await prisma.order.updateMany({
          where: {
            status: 'PAID',
            expiresAt: { lt: new Date() },
          },
          data: { status: 'EXPIRED' },
        })

        if (pending > 0 || paid.count > 0) {
          console.log(
            `[jobs] ${pending} pesanan PENDING dibatalkan, ${paid.count} pesanan PAID kedaluwarsa.`,
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
