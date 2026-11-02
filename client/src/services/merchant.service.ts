import api from './api'
import type { MerchantSummary, PinVerificationResult, Store, Tier } from '@/types'

export const merchantService = {
  async getStore(): Promise<Store> {
    const { data } = await api.get<Store>('/merchant/store')
    return data
  },

  async updateStock(tierId: string, stock: number): Promise<Tier> {
    const { data } = await api.patch<Tier>(`/merchant/tiers/${tierId}`, { stock })
    return data
  },

  async updateSchedule(pickupStart: string, pickupEnd: string): Promise<Store> {
    const { data } = await api.put<Store>('/merchant/schedule', { pickupStart, pickupEnd })
    return data
  },

  async getSummary(): Promise<MerchantSummary> {
    const { data } = await api.get<MerchantSummary>('/merchant/summary')
    return data
  },

  async verifyPin(pin: string): Promise<PinVerificationResult> {
    const { data } = await api.post<PinVerificationResult>('/merchant/verify-pin', { pin })
    return data
  },
}
