import api from './api'
import type { Order } from '@/types'

export interface CreateOrderPayload {
  storeId: string
  tierId: string
  qty: number
  paymentMethod: 'QRIS' | 'EWALLET'
}

export const orderService = {
  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>('/orders', payload)
    return data
  },

  async pay(orderId: string): Promise<Order> {
    const { data } = await api.post<Order>(`/orders/${orderId}/pay`)
    return data
  },

  async getById(orderId: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${orderId}`)
    return data
  },

  async mine(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders/mine')
    return data
  },
}
