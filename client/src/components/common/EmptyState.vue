<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="card flex flex-col items-center px-6 py-14 text-center">
    <div class="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl">
      <slot name="icon">🍽️</slot>
    </div>
    <h3 class="mt-4 text-lg font-bold text-stone-900">{{ title }}</h3>
    <p v-if="description" class="mt-2 max-w-md text-sm leading-relaxed text-stone-500">
      {{ description }}
    </p>
    <div v-if="$slots.action" class="mt-6">
      <slot name="action" />
    </div>
  </div>
</template>
