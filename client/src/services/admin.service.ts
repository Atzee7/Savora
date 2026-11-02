import api from './api'
import type { AdminMerchant, AdminOverview, CreateMerchantPayload, StoreStatus } from '@/types'

export const adminService = {
  async listMerchants(): Promise<AdminMerchant[]> {
    const { data } = await api.get<AdminMerchant[]>('/admin/merchants')
    return data
  },

  async createMerchant(payload: CreateMerchantPayload): Promise<AdminMerchant> {
    const { data } = await api.post<AdminMerchant>('/admin/merchants', payload)
    return data
  },

  async getOverview(): Promise<AdminOverview> {
    const { data } = await api.get<AdminOverview>('/admin/overview')
    return data
  },

  async updateStoreStatus(
    storeId: string,
    status: Extract<StoreStatus, 'ACTIVE' | 'WARNING' | 'SUSPENDED'>,
  ): Promise<{ id: string; storeName: string; status: StoreStatus }> {
    const { data } = await api.patch<{ id: string; storeName: string; status: StoreStatus }>(
      `/admin/stores/${storeId}/status`,
      { status },
    )
    return data
  },
}
