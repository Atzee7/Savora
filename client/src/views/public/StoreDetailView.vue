<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import StoreMap from '@/components/store/StoreMap.vue'
import TierCard from '@/components/store/TierCard.vue'
import { storeService } from '@/services/store.service'
import type { Store } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatTimeRange } from '@/utils/format'

const props = defineProps<{ id: string }>()

const store = ref<Store | null>(null)
const loading = ref(true)
const error = ref('')

async function loadStore(): Promise<void> {
  loading.value = true
  error.value = ''

  try {
    store.value = await storeService.getById(props.id)
  } catch (loadError) {
    store.value = null
    error.value = getErrorMessage(loadError, 'Toko tidak ditemukan atau sedang tidak aktif.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStore()
})

watch(
  () => props.id,
  () => {
    void loadStore()
  },
)
</script>

<template>
  <div class="container-page py-8 sm:py-12">
    <RouterLink to="/catalog" class="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-brand-700">
      <span aria-hidden="true">←</span> Kembali ke katalog
    </RouterLink>

    <div v-if="loading" class="mt-6 space-y-6">
      <div class="card h-56 animate-pulse bg-stone-100" />
      <div class="grid gap-5 md:grid-cols-3">
        <div v-for="index in 3" :key="index" class="card h-80 animate-pulse bg-stone-100" />
      </div>
    </div>

    <div v-else-if="error || !store" class="mt-6">
      <EmptyState title="Toko tidak tersedia" :description="error">
        <template #icon>🏪</template>
        <template #action>
          <RouterLink
            to="/catalog"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Lihat katalog
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <header class="relative mt-6 overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-8 text-white sm:px-10 sm:py-10">
        <div class="absolute -right-10 -top-16 h-64 w-64 rounded-full border-[24px] border-white/10" />
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge status="ACTIVE" />
              <span class="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-brand-50">
                {{ store.totalStock }} kantong tersedia
              </span>
            </div>
            <h1 class="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">{{ store.storeName }}</h1>
            <p class="mt-2 max-w-2xl text-sm leading-relaxed text-brand-100">{{ store.address }}</p>
          </div>

          <div v-if="store.schedules[0]" class="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
            <p class="text-[10px] font-bold uppercase tracking-wide text-brand-200">Jendela pickup</p>
            <p class="mt-1 text-lg font-extrabold">
              {{ formatTimeRange(store.schedules[0].pickupStart, store.schedules[0].pickupEnd) }}
            </p>
          </div>
        </div>
      </header>

      <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section>
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Pilih paket</p>
              <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">Tiga tier, satu kejutan.</h2>
            </div>
          </div>

          <div class="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <TierCard v-for="tier in store.tiers" :key="tier.id" :tier="tier" :store-id="store.id" />
          </div>

          <div class="card mt-6 p-6">
            <h3 class="text-base font-bold text-stone-900">Yang perlu kamu tahu</h3>
            <ul class="mt-4 space-y-3 text-sm leading-relaxed text-stone-600">
              <li class="flex gap-3">
                <span class="mt-0.5 text-brand-600">✓</span>
                Isi kantong bersifat kejutan, tetapi nilai asli makanan dijamin minimal sesuai tier.
              </li>
              <li class="flex gap-3">
                <span class="mt-0.5 text-brand-600">✓</span>
                Maksimal 2 kantong per transaksi per toko per hari.
              </li>
              <li class="flex gap-3">
                <span class="mt-0.5 text-brand-600">✓</span>
                Tunjukkan PIN 4 digit ke kasir pada jam pickup. Pesanan hangus jika terlewat.
              </li>
            </ul>
          </div>
        </section>

        <aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div class="overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
            <StoreMap :stores="[store]" height="15rem" />
          </div>

          <div class="card p-5">
            <p class="text-[10px] font-bold uppercase tracking-wide text-stone-400">Lokasi pickup</p>
            <p class="mt-2 text-sm font-semibold leading-relaxed text-stone-800">{{ store.address }}</p>
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`"
              target="_blank"
              rel="noreferrer"
              class="mt-3 inline-flex text-xs font-bold text-brand-700 hover:underline"
            >
              Buka di Google Maps ↗
            </a>
          </div>

          <div class="rounded-3xl border border-accent-200 bg-accent-50 p-5">
            <p class="text-[10px] font-bold uppercase tracking-wide text-accent-700">Tips</p>
            <p class="mt-2 text-sm leading-relaxed text-accent-900/80">
              Datang 10 menit sebelum jam pickup berakhir agar tidak terburu-buru. Bawa tas sendiri untuk mengurangi plastik.
            </p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
