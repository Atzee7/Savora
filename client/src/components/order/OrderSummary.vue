<script setup lang="ts">
import { computed } from 'vue'

import type { TierName } from '@/types'
import { formatRupiah } from '@/utils/format'

const props = defineProps<{
  storeName: string
  tierName: TierName
  qty: number
  unitPrice: number
}>()

const total = computed(() => props.qty * props.unitPrice)

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Tier Hemat',
  REGULER: 'Tier Reguler',
  BESAR: 'Tier Besar',
}
</script>

<template>
  <div class="card divide-y divide-stone-100">
    <div class="flex items-start justify-between gap-4 p-5">
      <div>
        <p class="text-[11px] font-bold uppercase tracking-wide text-stone-400">Toko</p>
        <p class="mt-1 text-sm font-bold text-stone-900">{{ storeName }}</p>
      </div>
      <span class="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
        {{ tierLabels[tierName] }}
      </span>
    </div>

    <div class="space-y-2 p-5 text-sm">
      <div class="flex justify-between text-stone-600">
        <span>{{ tierLabels[tierName] }} × {{ qty }}</span>
        <span>{{ formatRupiah(total) }}</span>
      </div>
      <div class="flex justify-between text-stone-400">
        <span>Biaya layanan</span>
        <span>Gratis</span>
      </div>
    </div>

    <div class="flex items-center justify-between p-5">
      <span class="text-sm font-semibold text-stone-500">Total bayar</span>
      <span class="text-xl font-extrabold text-brand-800">{{ formatRupiah(total) }}</span>
    </div>

    <slot />
  </div>
</template>
