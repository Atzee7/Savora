import { defineStore } from 'pinia'
import { ref } from 'vue'

import { orderService } from '@/services/order.service'
import type { Order } from '@/types'

export const useOrderStore = defineStore('order', () => {
  const orders = ref<Order[]>([])
  const activeOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMine(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      orders.value = await orderService.listMine()
    } catch {
      error.value = 'Riwayat pesanan belum bisa dimuat.'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(orderId: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      activeOrder.value = await orderService.getById(orderId)
    } catch {
      error.value = 'Tiket pesanan tidak ditemukan.'
    } finally {
      loading.value = false
    }
  }

  return {
    orders,
    activeOrder,
    loading,
    error,
    fetchMine,
    fetchById,
  }
})
