<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StoreCard from '@/components/store/StoreCard.vue'
import StoreMap from '@/components/store/StoreMap.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useCatalogStore } from '@/stores/catalog'

const catalog = useCatalogStore()
const route = useRoute()
const router = useRouter()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')

useAutoRefresh(() => catalog.refreshStores(), { interval: 25_000 })

onMounted(() => {
  void catalog.fetchStores()
})

watch(
  () => route.query.q,
  (value) => {
    const next = typeof value === 'string' ? value : ''

    if (next !== search.value) {
      search.value = next
    }
  },
)

watch(search, (value) => {
  const next = value.trim()
  const current = typeof route.query.q === 'string' ? route.query.q : ''

  if (next === current) {
    return
  }

  void router.replace({ query: { ...route.query, q: next || undefined } })
})

const filteredStores = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return catalog.stores
  }

  return catalog.stores.filter(
    (store) =>
      store.storeName.toLowerCase().includes(query) ||
      store.address.toLowerCase().includes(query),
  )
})
</script>

<template>
  <div class="container-page py-10 sm:py-14">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
          Katalog Savora
        </p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
          Surprise Bag di sekitar Malang
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
          Toko aktif dengan stok tersedia hari ini. Semua paket diambil sendiri di lokasi pada jam pickup.
        </p>
      </div>

      <div class="w-full sm:max-w-xs">
        <label for="catalog-search" class="label">Cari toko atau alamat</label>
        <div class="relative">
          <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">⌕</span>
          <input
            id="catalog-search"
            v-model="search"
            type="search"
            placeholder="Contoh: Lowokwaru, roti..."
            class="input pl-9"
          />
        </div>
      </div>
    </div>

    <div class="mt-8 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white p-2 shadow-card">
      <StoreMap :stores="filteredStores" height="19rem" />
    </div>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-4">
      <p class="text-sm font-semibold text-ink-500">
        <span class="text-ink-950">{{ filteredStores.length }}</span> toko ditemukan
      </p>
    </div>

    <div v-if="catalog.loading" class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="index in 6" :key="index" class="overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white">
        <div class="h-32 animate-pulse bg-sage-200" />
        <div class="space-y-3 p-5">
          <div class="h-4 w-2/3 animate-pulse rounded bg-sage-200" />
          <div class="h-3 w-full animate-pulse rounded bg-sage-200" />
          <div class="h-3 w-4/5 animate-pulse rounded bg-sage-200" />
          <div class="h-6 w-1/2 animate-pulse rounded-full bg-sage-200" />
        </div>
      </div>
    </div>

    <div v-else-if="catalog.error" class="mt-5">
      <EmptyState
        title="Katalog belum bisa dimuat"
        :description="catalog.error"
      >
        <template #icon>⚠️</template>
        <template #action>
          <AppButton @click="catalog.fetchStores(true)">Coba lagi</AppButton>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="filteredStores.length === 0" class="mt-5">
      <EmptyState
        title="Tidak ada toko yang cocok"
        description="Coba kata kunci lain, atau kembali lagi menjelang jam pickup malam ini."
      >
        <template #icon>🔎</template>
        <template #action>
          <AppButton v-if="search" type="button" variant="secondary" @click="search = ''">
            Hapus pencarian
          </AppButton>
          <RouterLink
            v-else
            to="/"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
          >
            Kembali ke beranda
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <div v-else class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StoreCard
        v-for="(store, index) in filteredStores"
        :key="store.id"
        v-reveal="{ delay: (index % 3) * 70 }"
        :store="store"
      />
    </div>
  </div>
</template>
