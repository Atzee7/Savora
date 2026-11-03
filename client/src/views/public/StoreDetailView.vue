<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import StoreMap from '@/components/store/StoreMap.vue'
import TierCard from '@/components/store/TierCard.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { storeService } from '@/services/store.service'
import type { Store } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatTimeRange } from '@/utils/format'
import { storeArea, storeImage } from '@/utils/storeImage'

const props = defineProps<{ id: string }>()

const store = ref<Store | null>(null)
const loading = ref(true)
const error = ref('')

const notes = [
  'Isi kantong bersifat kejutan, tetapi nilai asli makanan dijamin minimal sesuai tier.',
  'Maksimal 2 kantong per transaksi per toko per hari.',
  'Tunjukkan PIN 4 digit ke kasir pada jam pickup. Pesanan hangus jika terlewat.',
]

useAutoRefresh(refreshStore, {
  interval: 20_000,
  enabled: () => !loading.value && store.value !== null,
})

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

/** Pembaruan latar belakang: stok dan jadwal ikut berubah tanpa reload. */
async function refreshStore(): Promise<void> {
  store.value = await storeService.getById(props.id)
  error.value = ''
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
    <RouterLink
      to="/catalog"
      class="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
    >
      <span aria-hidden="true">←</span> Kembali ke katalog
    </RouterLink>

    <div v-if="loading" class="mt-6 space-y-6">
      <div class="h-52 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="grid gap-5 md:grid-cols-3">
        <div v-for="index in 3" :key="index" class="h-80 animate-pulse rounded-[2rem] bg-sage-200" />
      </div>
    </div>

    <div v-else-if="error || !store" class="mt-6">
      <EmptyState title="Toko tidak tersedia" :description="error">
        <template #icon>🏪</template>
        <template #action>
          <RouterLink
            to="/catalog"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
          >
            Lihat katalog
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-6">
        <PageHero
          :image="storeImage(store.storeName)"
          eyebrow="Toko Savora"
          :title="store.storeName"
          :description="store.address"
        >
          <template #badges>
            <StatusBadge status="ACTIVE" />
            <span
              class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
            >
              Buka malam ini
            </span>
          </template>

          <template v-if="store.schedules[0]" #aside>
            <div class="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-200">
                Jendela pickup
              </p>
              <p class="mt-1 text-lg font-extrabold text-white">
                {{ formatTimeRange(store.schedules[0].pickupStart, store.schedules[0].pickupEnd) }}
              </p>
            </div>
          </template>

          <template #meta>
            <span class="inline-flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
              {{ store.totalStock }} kantong tersedia
            </span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>{{ storeArea(store.address) }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>Ambil sendiri di toko</span>
          </template>
        </PageHero>
      </div>

      <div class="mt-10 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section>
          <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            Pilih paket
          </p>
          <h2 class="mt-3 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
            Tiga tier, satu kejutan.
          </h2>
          <p class="mt-3 max-w-xl text-sm leading-relaxed text-ink-600">
            Harga tetap, isi berbeda setiap malam. Pilih ukuran yang paling pas dengan nafsu makanmu.
          </p>

          <div class="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <TierCard
              v-for="(tier, index) in store.tiers"
              :key="tier.id"
              v-reveal="{ delay: index * 80 }"
              :tier="tier"
              :store-id="store.id"
            />
          </div>

          <section
            v-reveal
            class="mt-6 rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card sm:p-8"
          >
            <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
              Sebelum pesan
            </p>
            <h3 class="mt-3 text-lg font-extrabold tracking-tight text-ink-950">
              Yang perlu kamu tahu
            </h3>
            <ul class="mt-5 space-y-3.5 text-sm leading-relaxed text-ink-600">
              <li v-for="note in notes" :key="note" class="flex gap-3">
                <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" aria-hidden="true" />
                {{ note }}
              </li>
            </ul>
          </section>
        </section>

        <aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div class="overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white p-2 shadow-card">
            <StoreMap :stores="[store]" height="15rem" />
          </div>

          <section v-reveal class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink-500">
              Lokasi pickup
            </p>
            <p class="mt-2 text-sm font-semibold leading-relaxed text-ink-950">{{ store.address }}</p>
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${store.latitude},${store.longitude}`"
              target="_blank"
              rel="noreferrer"
              class="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 transition hover:text-brand-800"
            >
              Buka di Google Maps ↗
            </a>
          </section>

          <section v-reveal="{ delay: 60 }" class="rounded-[2rem] bg-sage-100 p-6">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-700">Tips</p>
            <p class="mt-2 text-sm leading-relaxed text-ink-700">
              Datang 10 menit sebelum jam pickup berakhir agar tidak terburu-buru. Bawa tas sendiri
              untuk mengurangi plastik.
            </p>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
