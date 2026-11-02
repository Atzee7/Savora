<script setup lang="ts">
import { computed } from 'vue'

import type { Tier, TierName } from '@/types'
import { formatRupiah } from '@/utils/format'

const props = defineProps<{
  tier: Tier
  storeId: string
}>()

const tierMeta: Record<
  TierName,
  { label: string; description: string; image: string; imageAlt: string }
> = {
  HEMAT: {
    label: 'Tier Hemat',
    description: 'Porsi pas untuk camilan atau makan ringan.',
    image: '/images/store-bakery.webp',
    imageAlt: 'Ilustrasi roti dan pastry untuk tier hemat',
  },
  REGULER: {
    label: 'Tier Reguler',
    description: 'Pilihan paling seimbang untuk makan kenyang.',
    image: '/images/tier-reguler.webp',
    imageAlt: 'Ilustrasi paket makanan untuk tier reguler',
  },
  BESAR: {
    label: 'Tier Besar',
    description: 'Isi lebih banyak, cocok dibagi atau disimpan.',
    image: '/images/tier-besar.webp',
    imageAlt: 'Ilustrasi paket makanan besar untuk tier besar',
  },
}

const meta = computed(() => tierMeta[props.tier.name])
const discount = computed(() =>
  Math.round((1 - props.tier.price / props.tier.minOriginalValue) * 100),
)
</script>

<template>
  <article
    class="group flex flex-col overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
  >
    <div class="relative h-36 overflow-hidden bg-ink-900">
      <img
        :src="meta.image"
        :alt="meta.imageAlt"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-ink-950/5"
        aria-hidden="true"
      />

      <span
        class="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur"
      >
        <span class="h-1 w-1 rounded-full bg-brand-300" aria-hidden="true" />
        {{ meta.label }}
      </span>

      <div class="absolute inset-x-4 bottom-3 text-white">
        <p class="text-2xl font-extrabold tracking-tight">{{ formatRupiah(tier.price) }}</p>
        <p class="mt-0.5 text-[11px] font-semibold text-sage-200">
          Senilai min. {{ formatRupiah(tier.minOriginalValue) }} · hemat {{ discount }}%
        </p>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-3 p-5">
      <p class="text-sm leading-relaxed text-ink-600">{{ meta.description }}</p>

      <div class="flex items-center justify-between gap-3 text-xs font-semibold">
        <span
          class="inline-flex items-center gap-1.5"
          :class="tier.stock > 0 ? 'text-brand-700' : 'text-red-600'"
        >
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="tier.stock > 0 ? 'bg-brand-600' : 'bg-red-500'"
            aria-hidden="true"
          />
          {{ tier.stock > 0 ? `Sisa ${tier.stock} kantong` : 'Stok habis' }}
        </span>
        <span class="text-ink-500">Isi kejutan</span>
      </div>

      <RouterLink
        v-if="tier.stock > 0"
        :to="{ name: 'checkout', params: { tierId: tier.id }, query: { store: storeId } }"
        class="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Pesan tier ini
        <svg
          class="h-4 w-4"
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
      </RouterLink>
      <span
        v-else
        class="mt-auto inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-full bg-sage-200 px-5 py-2.5 text-sm font-semibold text-ink-600"
      >
        Stok habis
      </span>
    </div>
  </article>
</template>
