<script setup lang="ts">
import { ref } from 'vue'

import AppInput from '@/components/common/AppInput.vue'

withDefaults(
  defineProps<{
    label?: string
    autocomplete?: string
    placeholder?: string
    hint?: string
    required?: boolean
  }>(),
  {
    required: false,
  },
)

const model = defineModel<string>({ default: '' })
const visible = ref(false)
</script>

<template>
  <AppInput
    v-model="model"
    :label="label"
    :autocomplete="autocomplete"
    :placeholder="placeholder"
    :hint="hint"
    :required="required"
    :type="visible ? 'text' : 'password'"
  >
    <template #trailing>
      <button
        type="button"
        class="grid h-11 w-11 place-items-center rounded-xl text-ink-600 transition hover:bg-sage-200/70 hover:text-ink-950"
        :aria-label="visible ? 'Sembunyikan password' : 'Tampilkan password'"
        :aria-pressed="visible"
        @click="visible = !visible"
      >
        <svg
          v-if="visible"
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M4 20 20 4" />
          <path d="M9.9 5.9A10.6 10.6 0 0 1 12 5.7c6 0 9.5 6.3 9.5 6.3a17.5 17.5 0 0 1-3.4 4" />
          <path d="M6.1 7.8A17.2 17.2 0 0 0 2.5 12s3.5 6.3 9.5 6.3a10 10 0 0 0 4.2-.9" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
        <svg
          v-else
          class="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M2.5 12S6 5.7 12 5.7 21.5 12 21.5 12 18 18.3 12 18.3 2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </template>
  </AppInput>
</template>
