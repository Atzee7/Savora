<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StoreCard from '@/components/store/StoreCard.vue'
import StoreMap from '@/components/store/StoreMap.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useUserLocation } from '@/composables/useUserLocation'
import { useCatalogStore } from '@/stores/catalog'
import { formatDistance, haversineKm } from '@/utils/distance'

const catalog = useCatalogStore()
const route = useRoute()
const router = useRouter()
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')

const {
  location,
  status: locationStatus,
  error: locationError,
  supported,
  request: requestLocation,
  clear: clearLocation,
} = useUserLocation()

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

const locating = computed(() => locationStatus.value === 'requesting')

const distanceById = computed(() => {
  const distances = new Map<string, number>()
  const origin = location.value

  if (!origin) {
    return distances
  }

  for (const store of catalog.stores) {
    distances.set(
      store.id,
      haversineKm(origin.latitude, origin.longitude, store.latitude, store.longitude),
    )
  }

  return distances
})

const visibleStores = computed(() => {
  if (!location.value) {
    return filteredStores.value
  }

  return [...filteredStores.value].sort(
    (a, b) => (distanceById.value.get(a.id) ?? Infinity) - (distanceById.value.get(b.id) ?? Infinity),
  )
})

const nearestId = computed(() =>
  location.value && visibleStores.value.length > 0 ? visibleStores.value[0].id : null,
)

const accuracyLabel = computed(() => {
  const accuracy = location.value?.accuracy

  if (!accuracy || accuracy <= 0) {
    return ''
  }

  return formatDistance(accuracy / 1000)
})

function openStore(storeId: string): void {
  void router.push({ name: 'store-detail', params: { id: storeId } })
}
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

    <div class="mt-8 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card">
      <div
        class="flex flex-col gap-3 border-b border-ink-900/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      >
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="location">
            <AppButton
              variant="secondary"
              size="sm"
              :loading="locating"
              @click="requestLocation"
            >
              Perbarui lokasi
            </AppButton>
            <AppButton variant="ghost" size="sm" @click="clearLocation">Hapus lokasi</AppButton>
          </template>
          <AppButton
            v-else
            variant="ink"
            size="sm"
            :loading="locating"
            :disabled="!supported"
            @click="requestLocation"
          >
            <svg
              class="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 21s-6-5.4-6-10a6 6 0 1 1 12 0c0 4.6-6 10-6 10Z" />
              <circle cx="12" cy="11" r="2.2" />
            </svg>
            {{ locating ? 'Mendeteksi lokasi…' : 'Gunakan lokasi saya' }}
          </AppButton>
        </div>

        <p v-if="location" class="text-xs font-semibold text-ink-600">
          Diurutkan dari yang terdekat
          <span v-if="accuracyLabel" class="font-normal text-ink-500">
            · akurasi ±{{ accuracyLabel }}
          </span>
        </p>
        <p v-else-if="locationError" class="text-xs leading-relaxed text-red-700" role="alert">
          {{ locationError }}
        </p>
        <p v-else-if="!supported" class="text-xs text-ink-500">
          Perangkat ini tidak mendukung deteksi lokasi.
        </p>
        <p v-else class="text-xs text-ink-500">
          Aktifkan lokasi untuk melihat toko terdekat dari posisi kamu.
        </p>
      </div>

      <div class="p-2">
        <StoreMap
          :stores="visibleStores"
          :user-location="location"
          height="19rem"
          show-store-link
          @open-store="openStore"
        />
      </div>
    </div>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-4">
      <p class="text-sm font-semibold text-ink-500">
        <span class="text-ink-950">{{ visibleStores.length }}</span> toko ditemukan
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

    <div v-else-if="visibleStores.length === 0" class="mt-5">
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
        v-for="(store, index) in visibleStores"
        :key="store.id"
        v-reveal="{ delay: (index % 3) * 70 }"
        :store="store"
        :distance-km="distanceById.get(store.id) ?? null"
        :is-nearest="store.id === nearestId"
      />
    </div>
  </div>
</template>
