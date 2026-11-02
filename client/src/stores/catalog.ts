import { defineStore } from 'pinia'
import { ref } from 'vue'

import { storeService } from '@/services/store.service'
import type { Store } from '@/types'

export const useCatalogStore = defineStore('catalog', () => {
  const stores = ref<Store[]>([])
  const loading = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)
  const hasLoaded = ref(false)
  const lastUpdated = ref<Date | null>(null)

  async function fetchStores(force = false): Promise<void> {
    if (loading.value || (hasLoaded.value && !force)) {
      return
    }

    loading.value = true
    error.value = null

    try {
      stores.value = await storeService.list()
      hasLoaded.value = true
      lastUpdated.value = new Date()
    } catch {
      error.value = 'Katalog toko belum bisa dimuat. Pastikan API dan database berjalan.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Pembaruan latar belakang: tidak menampilkan skeleton dan tidak menghapus
   * data lama bila permintaan gagal.
   */
  async function refreshStores(): Promise<void> {
    if (loading.value || refreshing.value) {
      return
    }

    refreshing.value = true

    try {
      stores.value = await storeService.list()
      hasLoaded.value = true
      error.value = null
      lastUpdated.value = new Date()
    } catch {
      // Biarkan data lama tampil; pengguna tetap bisa memakai tombol muat ulang.
    } finally {
      refreshing.value = false
    }
  }

  return {
    stores,
    loading,
    refreshing,
    error,
    hasLoaded,
    lastUpdated,
    fetchStores,
    refreshStores,
  }
})
