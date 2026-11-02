<script setup lang="ts">
type IconName = 'bag' | 'card' | 'pin'

withDefaults(
  defineProps<{
    index: number
    title: string
    description: string
    icon: IconName
    last?: boolean
  }>(),
  { last: false },
)
</script>

<template>
  <li class="group relative grid grid-cols-[auto_1fr] items-start gap-5 lg:block">
    <div class="relative lg:w-14">
      <span
        class="relative z-10 grid h-14 w-14 place-items-center rounded-2xl border border-ink-900/10 bg-sage-100 text-ink-800 transition group-hover:border-ink-900/25 group-hover:bg-white"
      >
        <svg
          v-if="icon === 'bag'"
          class="h-6 w-6"
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

        <svg
          v-else-if="icon === 'card'"
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M3 10h18" />
          <path d="M7 14h4" />
        </svg>

        <svg
          v-else
          class="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
      </span>

      <span
        class="absolute -bottom-1.5 -right-1.5 z-20 grid h-7 w-7 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white ring-4 ring-white"
        aria-hidden="true"
      >
        {{ index }}
      </span>
    </div>

    <span
      v-if="!last"
      class="absolute left-7 top-[4.25rem] -bottom-10 border-l border-dashed border-ink-900/15 lg:hidden"
      aria-hidden="true"
    />

    <div class="lg:mt-7">
      <h3 class="text-lg font-extrabold tracking-tight text-ink-950 sm:text-xl">
        <span class="sr-only">Langkah {{ index }}: </span>{{ title }}
      </h3>
      <p class="mt-2 text-sm leading-relaxed text-ink-600">{{ description }}</p>
    </div>
  </li>
</template>
