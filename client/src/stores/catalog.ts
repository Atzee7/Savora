import { defineStore } from 'pinia'
import { ref } from 'vue'

import { storeService } from '@/services/store.service'
import type { Store } from '@/types'

export const useCatalogStore = defineStore('catalog', () => {
  const stores = ref<Store[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasLoaded = ref(false)

  async function fetchStores(force = false): Promise<void> {
    if (loading.value || (hasLoaded.value && !force)) {
      return
    }

    loading.value = true
    error.value = null

    try {
      stores.value = await storeService.list()
      hasLoaded.value = true
    } catch {
      error.value = 'Katalog toko belum bisa dimuat. Pastikan API dan database berjalan.'
    } finally {
      loading.value = false
    }
  }

  return {
    stores,
    loading,
    error,
    hasLoaded,
    fetchStores,
  }
})
