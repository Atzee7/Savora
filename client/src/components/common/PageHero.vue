<script setup lang="ts">
withDefaults(
  defineProps<{
    image: string
    eyebrow: string
    title: string
    description?: string
  }>(),
  { description: '' },
)
</script>

<template>
  <header class="relative isolate overflow-hidden rounded-[2rem] bg-ink-950 text-white">
    <img
      :src="image"
      alt=""
      class="absolute inset-0 -z-10 h-full w-full object-cover object-center"
    />
    <div
      class="absolute inset-0 -z-10 bg-gradient-to-br from-ink-950/92 via-ink-950/70 to-ink-950/95"
      aria-hidden="true"
    />

    <div class="relative flex flex-col gap-6 p-6 sm:p-9 lg:flex-row lg:items-end lg:justify-between">
      <div class="min-w-0">
        <div v-if="$slots.badges" class="flex flex-wrap items-center gap-2">
          <slot name="badges" />
        </div>
        <p
          class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-300"
          :class="$slots.badges ? 'mt-4' : ''"
        >
          {{ eyebrow }}
        </p>
        <h1 class="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
          {{ title }}
        </h1>
        <p v-if="description" class="mt-3 max-w-xl text-sm leading-relaxed text-sage-200">
          {{ description }}
        </p>
      </div>

      <div v-if="$slots.aside" class="shrink-0">
        <slot name="aside" />
      </div>
    </div>

    <div
      v-if="$slots.meta"
      class="relative flex flex-wrap items-center gap-2 border-t border-white/15 bg-ink-950/55 px-6 py-4 text-xs font-semibold text-sage-100 backdrop-blur-sm sm:px-9"
    >
      <slot name="meta" />
    </div>
  </header>
</template>
