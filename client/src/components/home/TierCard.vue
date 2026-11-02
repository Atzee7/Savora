<script setup lang="ts">
import { formatRupiah } from '@/utils/format'

withDefaults(
  defineProps<{
    index: number
    name: string
    price: number
    original: number
    description: string
    image: string
    featured?: boolean
  }>(),
  { featured: false },
)
</script>

<template>
  <RouterLink
    to="/catalog"
    class="group relative flex h-[20rem] flex-col overflow-hidden rounded-[2rem] bg-ink-900 focus-visible:outline-offset-4 sm:h-[22rem] lg:h-[26rem]"
    :class="featured ? 'ring-1 ring-inset ring-white/30' : ''"
  >
    <img
      :src="image"
      :alt="`Ilustrasi kantong tier ${name}`"
      loading="lazy"
      class="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
    <div
      class="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/45 to-ink-950/15"
      aria-hidden="true"
    />

    <div class="relative flex h-full flex-col justify-between p-6 text-white">
      <div class="flex items-start justify-between gap-3">
        <span
          class="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur"
        >
          <span
            class="h-1 w-1 rounded-full"
            :class="featured ? 'bg-brand-300' : 'bg-sage-200'"
            aria-hidden="true"
          />
          Tier 0{{ index }}
        </span>

        <span
          class="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-white backdrop-blur"
        >
          <svg
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M6 8h12l1 12H5L6 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </span>
      </div>

      <div>
        <h3 class="text-2xl font-extrabold tracking-tight">{{ name }}</h3>

        <p class="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          {{ formatRupiah(price) }}
        </p>

        <p class="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sage-300">
          Nilai asli min.
          <s class="text-sage-200/80">{{ formatRupiah(original) }}</s>
        </p>

        <p class="mt-3 max-w-[16rem] text-sm leading-relaxed text-sage-100">
          {{ description }}
        </p>

        <span
          class="mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white"
        >
          Pilih tier
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
