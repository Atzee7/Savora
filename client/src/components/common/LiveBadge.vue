<script setup lang="ts">
import { computed } from 'vue'

import { formatTime } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    updatedAt?: Date | null
    label?: string
    tone?: 'light' | 'dark'
  }>(),
  {
    updatedAt: null,
    label: 'Otomatis',
    tone: 'light',
  },
)

const updatedLabel = computed(() => (props.updatedAt ? formatTime(props.updatedAt) : ''))
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold"
    :class="
      tone === 'dark'
        ? 'border-white/25 bg-white/10 text-sage-100 backdrop-blur'
        : 'border-ink-900/10 bg-white text-ink-600'
    "
  >
    <span class="relative flex h-1.5 w-1.5" aria-hidden="true">
      <span
        class="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-60 motion-safe:animate-ping"
      />
      <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-500" />
    </span>
    <span>
      {{ label }}<template v-if="updatedLabel"> · {{ updatedLabel }}</template>
    </span>
  </span>
</template>
