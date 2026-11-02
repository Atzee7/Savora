<script setup lang="ts">
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    steps?: string[]
  }>(),
  {
    eyebrow: 'Tahap berikutnya',
    steps: () => [],
  },
)
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <div class="card overflow-hidden">
      <div class="border-b border-stone-200 bg-gradient-to-br from-brand-50 via-white to-accent-50 px-6 py-8 sm:px-8">
        <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700">{{ eyebrow }}</p>
        <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{{ title }}</h1>
        <p v-if="description" class="mt-3 text-sm leading-relaxed text-stone-600">{{ description }}</p>
      </div>
      <div class="px-6 py-6 sm:px-8">
        <ul v-if="steps.length" class="space-y-3">
          <li v-for="step in steps" :key="step" class="flex items-start gap-3 text-sm text-stone-600">
            <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-700">
              ✓
            </span>
            {{ step }}
          </li>
        </ul>
        <slot />
      </div>
    </div>
  </section>
</template>
