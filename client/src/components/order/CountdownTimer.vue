<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    expiresAt?: string | Date | null
    compact?: boolean
  }>(),
  {
    expiresAt: null,
    compact: false,
  },
)

const emit = defineEmits<{ expired: [] }>()

const remainingSeconds = ref(0)
const expiredEmitted = ref(false)
let intervalId: number | undefined

function tick(): void {
  if (!props.expiresAt) {
    remainingSeconds.value = 0
    return
  }

  const diff = new Date(props.expiresAt).getTime() - Date.now()
  remainingSeconds.value = Math.max(0, Math.floor(diff / 1000))

  if (remainingSeconds.value === 0 && !expiredEmitted.value) {
    expiredEmitted.value = true
    emit('expired')
  }
}

function restart(): void {
  expiredEmitted.value = false
  tick()
}

const formatted = computed(() => {
  if (!props.expiresAt) {
    return '--:--'
  }

  const hours = Math.floor(remainingSeconds.value / 3600)
  const minutes = Math.floor((remainingSeconds.value % 3600) / 60)
  const seconds = remainingSeconds.value % 60

  const parts = [
    hours > 0 ? String(hours).padStart(2, '0') : null,
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].filter((part): part is string => part !== null)

  return parts.join(':')
})

watch(() => props.expiresAt, restart)

onMounted(() => {
  tick()
  intervalId = window.setInterval(tick, 1000)
})

onBeforeUnmount(() => {
  if (intervalId !== undefined) {
    window.clearInterval(intervalId)
  }
})
</script>

<template>
  <div
    class="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2"
    :class="compact ? 'text-xs' : 'text-sm'"
  >
    <span class="grid h-7 w-7 place-items-center rounded-full bg-accent-100 text-accent-700">⏱</span>
    <div class="leading-tight">
      <p class="text-[10px] font-semibold uppercase tracking-wide text-stone-400">Sisa waktu</p>
      <p class="font-mono font-bold text-stone-800">{{ formatted }}</p>
    </div>
  </div>
</template>
