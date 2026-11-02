<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const labels: Record<string, string> = {
  PENDING: 'Menunggu',
  PAID: 'Dibayar',
  COMPLETED: 'Selesai',
  EXPIRED: 'Kedaluwarsa',
  CANCELLED: 'Dibatalkan',
  ACTIVE: 'Buka',
  WARNING: 'Peringatan',
  SUSPENDED: 'Ditangguhkan',
}

const tones: Record<string, string> = {
  PENDING: 'bg-sage-200 text-ink-700',
  PAID: 'bg-brand-100 text-brand-800',
  COMPLETED: 'bg-brand-700 text-white',
  EXPIRED: 'bg-sage-200 text-ink-500',
  CANCELLED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-brand-100 text-brand-800',
  WARNING: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}

const classes = computed(() => tones[props.status] ?? 'bg-sage-200 text-ink-600')
const label = computed(() => labels[props.status] ?? props.status)
</script>

<template>
  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold" :class="classes">
    {{ label }}
  </span>
</template>
