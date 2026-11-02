<script setup lang="ts">
import { computed } from 'vue'

import type { Store, Tier } from '@/types'
import { formatRupiah, formatTimeRange } from '@/utils/format'
import { storeArea, storeImage } from '@/utils/storeImage'

const props = defineProps<{ store: Store }>()

const image = computed(() => storeImage(props.store.storeName))
const area = computed(() => storeArea(props.store.address))
const schedule = computed(() => props.store.schedules[0] ?? null)

const cheapestTier = computed<Tier | null>(() => {
  const available = props.store.tiers.filter((tier) => tier.stock > 0)
  const pool = available.length > 0 ? available : props.store.tiers

  return pool.reduce<Tier | null>(
    (current, tier) => (!current || tier.price < current.price ? tier : current),
    null,
  )
})
</script>

<template>
  <RouterLink
    :to="{ name: 'store-detail', params: { id: store.id } }"
    class="group relative flex h-[20rem] flex-col justify-end overflow-hidden rounded-3xl bg-ink-900 focus-visible:outline-offset-4"
  >
    <img
      :src="image"
      :alt="`Ilustrasi ${store.storeName}`"
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/30 to-ink-950/5" />

    <span
      class="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold text-ink-900 shadow-sm"
    >
      {{ cheapestTier ? `Mulai ${formatRupiah(cheapestTier.price)}` : 'Stok menyusul' }}
    </span>

    <div class="relative p-5 text-white">
      <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-sage-200">{{ area }}</p>
      <h3 class="mt-1 text-lg font-extrabold leading-snug">{{ store.storeName }}</h3>
      <div class="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-sage-100">
        <span>
          {{ schedule ? formatTimeRange(schedule.pickupStart, schedule.pickupEnd) : 'Jadwal menyusul' }}
        </span>
        <span class="h-1 w-1 rounded-full bg-sage-200/70" aria-hidden="true" />
        <span>{{ store.totalStock }} kantong</span>
      </div>
    </div>
  </RouterLink>
</template>
