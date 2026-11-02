<script setup lang="ts">
import { computed } from 'vue'

import type { Tier, TierName } from '@/types'
import { formatRupiah } from '@/utils/format'

const props = defineProps<{
  tier: Tier
  storeId: string
}>()

const tierMeta: Record<TierName, { label: string; description: string; emoji: string; badge: string; surface: string }> = {
  HEMAT: {
    label: 'Tier Hemat',
    description: 'Porsi pas untuk camilan atau makan ringan.',
    emoji: '🥯',
    badge: 'bg-brand-100 text-brand-800',
    surface: 'from-brand-50 to-white',
  },
  REGULER: {
    label: 'Tier Reguler',
    description: 'Pilihan paling seimbang untuk makan kenyang.',
    emoji: '🥐',
    badge: 'bg-accent-100 text-accent-700',
    surface: 'from-accent-50 to-white',
  },
  BESAR: {
    label: 'Tier Besar',
    description: 'Isi lebih banyak, cocok dibagi atau disimpan.',
    emoji: '🥖',
    badge: 'bg-orange-100 text-orange-700',
    surface: 'from-orange-50 to-white',
  },
}

const meta = computed(() => tierMeta[props.tier.name])
const discount = computed(() =>
  Math.round((1 - props.tier.price / props.tier.minOriginalValue) * 100),
)
</script>

<template>
  <article class="card flex flex-col overflow-hidden">
    <div class="bg-gradient-to-br px-5 pb-5 pt-5" :class="meta.surface">
      <div class="flex items-center justify-between gap-3">
        <span class="rounded-full px-2.5 py-1 text-[11px] font-bold" :class="meta.badge">
          {{ meta.label }}
        </span>
        <span class="text-3xl">{{ meta.emoji }}</span>
      </div>
      <p class="mt-4 text-3xl font-extrabold tracking-tight text-stone-900">
        {{ formatRupiah(tier.price) }}
      </p>
      <p class="mt-1 text-xs font-medium text-stone-500">
        Senilai min. {{ formatRupiah(tier.minOriginalValue) }} · hemat {{ discount }}%
      </p>
    </div>

    <div class="flex flex-1 flex-col gap-4 px-5 py-5">
      <p class="text-sm leading-relaxed text-stone-600">{{ meta.description }}</p>

      <div class="flex items-center justify-between text-xs font-semibold">
        <span :class="tier.stock > 0 ? 'text-brand-700' : 'text-red-600'">
          {{ tier.stock > 0 ? `Sisa ${tier.stock} kantong` : 'Stok habis' }}
        </span>
        <span class="text-stone-400">Isi surprise</span>
      </div>

      <RouterLink
        v-if="tier.stock > 0"
        :to="{ name: 'checkout', params: { tierId: tier.id }, query: { store: storeId } }"
        class="mt-auto inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Pesan tier ini
      </RouterLink>
      <span
        v-else
        class="mt-auto inline-flex cursor-not-allowed items-center justify-center rounded-full bg-stone-100 px-5 py-2.5 text-sm font-semibold text-stone-400"
      >
        Stok habis
      </span>
    </div>
  </article>
</template>
