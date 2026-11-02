import { OrderStatus } from '@prisma/client'

import { prisma } from '../config/prisma.js'

type PendingCloseStatus = typeof OrderStatus.EXPIRED | typeof OrderStatus.CANCELLED

/**
 * Menutup order PENDING dan mengembalikan stok tier.
 * Status dijaga lewat updateMany agar balapan dengan pembayaran/cron tidak menggandakan stok.
 */
export async function closePendingOrder(
  orderId: string,
  status: PendingCloseStatus,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, tierId: true, qty: true },
    })

    if (!order || order.status !== OrderStatus.PENDING) {
      return false
    }

    const updated = await tx.order.updateMany({
      where: { id: orderId, status: OrderStatus.PENDING },
      data: { status },
    })

    if (updated.count === 0) {
      return false
    }

    await tx.tier.update({
      where: { id: order.tierId },
      data: { stock: { increment: order.qty } },
    })

    return true
  })
}

/** Menandai semua order PENDING yang lewat batas bayar sebagai EXPIRED dan restore stoknya. */
export async function expireOverduePendingOrders(customerId?: string): Promise<number> {
  const overdue = await prisma.order.findMany({
    where: {
      status: OrderStatus.PENDING,
      expiresAt: { lt: new Date() },
      ...(customerId ? { customerId } : {}),
    },
    select: { id: true },
    take: 200,
  })

  let count = 0

  for (const order of overdue) {
    if (await closePendingOrder(order.id, OrderStatus.EXPIRED)) {
      count += 1
    }
  }

  return count
}
