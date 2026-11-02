import api from './api'
import type { Store } from '@/types'

export const storeService = {
  async list(search?: string): Promise<Store[]> {
    const { data } = await api.get<Store[]>('/stores', {
      params: search ? { q: search } : undefined,
    })
    return data
  },

  async getById(id: string): Promise<Store> {
    const { data } = await api.get<Store>(`/stores/${id}`)
    return data
  },
}
