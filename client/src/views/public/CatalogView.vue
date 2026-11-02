<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StoreCard from '@/components/store/StoreCard.vue'
import StoreMap from '@/components/store/StoreMap.vue'
import { useCatalogStore } from '@/stores/catalog'

const catalog = useCatalogStore()
const search = ref('')

onMounted(() => {
  void catalog.fetchStores()
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
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Katalog Savora</p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
          Surprise Bag di sekitar Malang
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-stone-500">
          Toko aktif dengan stok tersedia hari ini. Semua paket diambil sendiri di lokasi pada jam pickup.
        </p>
      </div>

      <div class="w-full sm:max-w-xs">
        <label for="catalog-search" class="label">Cari toko atau alamat</label>
        <div class="relative">
          <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">⌕</span>
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

    <div class="mt-8 overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
      <StoreMap :stores="filteredStores" height="19rem" />
    </div>

    <div class="mt-8 flex items-center justify-between gap-4">
      <p class="text-sm font-semibold text-stone-500">
        <span class="text-stone-900">{{ filteredStores.length }}</span> toko ditemukan
      </p>
      <button
        v-if="catalog.hasLoaded"
        type="button"
        class="text-xs font-semibold text-brand-700 hover:underline"
        :disabled="catalog.loading"
        @click="catalog.fetchStores(true)"
      >
        Muat ulang
      </button>
    </div>

    <div v-if="catalog.loading" class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="index in 6" :key="index" class="card overflow-hidden">
        <div class="h-32 animate-pulse bg-stone-100" />
        <div class="space-y-3 p-5">
          <div class="h-4 w-2/3 animate-pulse rounded bg-stone-100" />
          <div class="h-3 w-full animate-pulse rounded bg-stone-100" />
          <div class="h-3 w-4/5 animate-pulse rounded bg-stone-100" />
          <div class="h-6 w-1/2 animate-pulse rounded-full bg-stone-100" />
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
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Kembali ke beranda
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <div v-else class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StoreCard v-for="store in filteredStores" :key="store.id" :store="store" />
    </div>
  </div>
</template>
