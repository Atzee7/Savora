<script setup lang="ts">
type IconName = 'leaf' | 'tag' | 'ticket'

defineProps<{
  title: string
  description: string
  icon: IconName
}>()
</script>

<template>
  <article class="flex gap-4 rounded-2xl bg-sage-300/55 p-5 sm:p-6">
    <div class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-900 text-sage-100">
      <svg
        v-if="icon === 'leaf'"
        class="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 4C11 4 5 8 5 15a5 5 0 0 0 5 5c7 0 10-6 10-16Z" />
        <path d="M8 20c1-6 5-10 10-12" />
      </svg>

      <svg
        v-else-if="icon === 'tag'"
        class="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12V6a2 2 0 0 1 2-2h6l8 8-8 8-8-8Z" />
        <circle cx="8.5" cy="8.5" r="1.2" />
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
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
        <path d="M13 6v12" stroke-dasharray="2 2" />
      </svg>
    </div>

    <div>
      <h3 class="text-base font-extrabold text-ink-950">{{ title }}</h3>
      <p class="mt-1.5 text-sm leading-relaxed text-ink-700">{{ description }}</p>
    </div>
  </article>
</template>
