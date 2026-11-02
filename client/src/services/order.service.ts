import api from './api'
import type { CheckoutInfo, CreateOrderPayload, FeedbackPayload, Order } from '@/types'

export const orderService = {
  async checkoutInfo(tierId: string): Promise<CheckoutInfo> {
    const { data } = await api.get<CheckoutInfo>(`/orders/checkout/${tierId}`)
    return data
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const { data } = await api.post<Order>('/orders', payload)
    return data
  },

  async listMine(): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/orders/mine')
    return data
  },

  async getById(id: string): Promise<Order> {
    const { data } = await api.get<Order>(`/orders/${id}`)
    return data
  },

  async pay(id: string): Promise<Order> {
    const { data } = await api.post<Order>(`/orders/${id}/pay`)
    return data
  },

  async cancel(id: string): Promise<Order> {
    const { data } = await api.post<Order>(`/orders/${id}/cancel`)
    return data
  },

  async submitFeedback(id: string, payload: FeedbackPayload): Promise<Order> {
    const { data } = await api.post<Order>(`/orders/${id}/feedback`, payload)
    return data
  },
}
