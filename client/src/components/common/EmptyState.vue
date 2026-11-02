<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-center rounded-[2rem] border border-ink-900/10 bg-white px-6 py-14 text-center shadow-card"
  >
    <div class="grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-2xl">
      <slot name="icon">🍽️</slot>
    </div>
    <h3 class="mt-4 text-lg font-extrabold tracking-tight text-ink-950">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-md text-sm leading-relaxed text-ink-600">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
