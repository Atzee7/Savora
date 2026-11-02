<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{ pin: string | null }>()

const copied = ref(false)
let copyTimer: number | undefined

const digits = computed(() => (props.pin ?? '••••').padEnd(4, '•').slice(0, 4).split(''))

async function copyPin(): Promise<void> {
  if (!props.pin) {
    return
  }

  try {
    await navigator.clipboard.writeText(props.pin)
    copied.value = true
    window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    copied.value = false
  }
}

onBeforeUnmount(() => window.clearTimeout(copyTimer))
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex gap-2.5">
      <span
        v-for="(digit, index) in digits"
        :key="index"
        class="grid h-14 w-12 place-items-center rounded-xl border border-brand-200 bg-brand-50 text-2xl font-extrabold text-brand-800 sm:h-16 sm:w-14"
      >
        {{ digit }}
      </span>
    </div>
    <button
      v-if="pin"
      type="button"
      class="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
      @click="copyPin"
    >
      {{ copied ? 'PIN tersalin ✓' : 'Salin PIN' }}
    </button>
  </div>
</template>
