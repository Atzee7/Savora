import cron from 'node-cron'

import { env } from '../config/env.js'
import { prisma } from '../config/prisma.js'

/**
 * Setiap menit:
 *  - order PAID yang melewati batas pickup menjadi EXPIRED (no refund).
 *
 * TODO(order-flow): batalkan order PENDING yang tidak dibayar dan kembalikan stok.
 */
export function startExpireOrdersJob(): void {
  if (env.NODE_ENV === 'test') {
    return
  }

  cron.schedule(
    '* * * * *',
    async () => {
      try {
        const result = await prisma.order.updateMany({
          where: {
            status: 'PAID',
            expiresAt: { lt: new Date() },
          },
          data: { status: 'EXPIRED' },
        })

        if (result.count > 0) {
          console.log(`[jobs] ${result.count} pesanan ditandai EXPIRED.`)
        }
      } catch (error) {
        console.error('[jobs] Gagal memproses pesanan kedaluwarsa:', error)
      }
    },
    { timezone: 'Asia/Jakarta' },
  )

  console.log('[jobs] expire-orders aktif (setiap menit).')
}
