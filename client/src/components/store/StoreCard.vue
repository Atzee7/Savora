<script setup lang="ts">
import { computed } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'
import type { Store } from '@/types'
import { formatRupiah, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

const props = defineProps<{ store: Store }>()

const cheapestTier = computed(() =>
  props.store.tiers.reduce<(typeof props.store.tiers)[number] | undefined>(
    (cheapest, tier) => (!cheapest || tier.price < cheapest.price ? tier : cheapest),
    undefined,
  ),
)

const pickupLabel = computed(() => {
  const schedule = props.store.schedules[0]
  return schedule ? formatTimeRange(schedule.pickupStart, schedule.pickupEnd) : 'Jadwal menyusul'
})
</script>

<template>
  <RouterLink
    :to="{ name: 'store-detail', params: { id: store.id } }"
    class="group flex flex-col overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:border-ink-900/25"
  >
    <div class="relative h-40 overflow-hidden bg-ink-900">
      <img
        :src="storeImage(store.storeName)"
        :alt="`Ilustrasi ${store.storeName}`"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-ink-950/10"
        aria-hidden="true"
      />

      <span class="absolute left-4 top-4">
        <StatusBadge status="ACTIVE" />
      </span>
      <span
        class="absolute right-4 top-4 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur"
      >
        {{ store.totalStock }} kantong
      </span>

      <div class="absolute inset-x-4 bottom-3 min-w-0 text-white">
        <p class="truncate text-lg font-extrabold tracking-tight">{{ store.storeName }}</p>
        <p class="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-sage-200">
          Ambil {{ pickupLabel }}
        </p>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <p class="line-clamp-2 text-sm leading-relaxed text-ink-600">{{ store.address }}</p>

      <div class="mt-auto flex items-center justify-between gap-3 pt-1">
        <span v-if="cheapestTier" class="text-sm font-extrabold tracking-tight text-ink-950">
          Mulai {{ formatRupiah(cheapestTier.price) }}
        </span>
        <span
          class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700"
        >
          Lihat toko
          <svg
            class="h-3.5 w-3.5 transition group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M4 10h12M11 5l5 5-5 5" />
          </svg>
        </span>
      </div>
    </div>
  </RouterLink>
</template>
