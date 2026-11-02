<script setup lang="ts">
import { computed } from 'vue'

import StatusBadge from '@/components/common/StatusBadge.vue'
import type { Store } from '@/types'
import { formatRupiah, formatTimeRange } from '@/utils/format'

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
    class="group flex flex-col overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card"
  >
    <div class="relative h-32 overflow-hidden bg-gradient-to-br from-brand-100 via-brand-50 to-accent-100">
      <div class="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/40" />
      <div class="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-brand-200/50" />
      <span class="absolute bottom-3 left-5 text-5xl drop-shadow-sm">🥐</span>
      <span class="absolute right-4 top-4">
        <StatusBadge status="ACTIVE" />
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <div class="flex items-start justify-between gap-3">
        <h3 class="text-base font-extrabold leading-snug text-stone-900 group-hover:text-brand-800">
          {{ store.storeName }}
        </h3>
        <span class="shrink-0 rounded-full bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-600">
          {{ store.totalStock }} kantong
        </span>
      </div>

      <p class="line-clamp-2 text-sm leading-relaxed text-stone-500">{{ store.address }}</p>

      <div class="mt-auto flex flex-wrap items-center gap-2 pt-1 text-[11px] font-semibold">
        <span class="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">Ambil {{ pickupLabel }}</span>
        <span v-if="cheapestTier" class="rounded-full bg-accent-50 px-2.5 py-1 text-accent-700">
          Mulai {{ formatRupiah(cheapestTier.price) }}
        </span>
      </div>
    </div>
  </RouterLink>
</template>
