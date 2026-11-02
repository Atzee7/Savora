<script setup lang="ts">
import { useId } from 'vue'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    label?: string
    error?: string
    hint?: string
    type?: string
    placeholder?: string
    autocomplete?: string
    required?: boolean
    disabled?: boolean
  }>(),
  {
    type: 'text',
    required: false,
    disabled: false,
  },
)

const model = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="label">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      v-bind="$attrs"
      :type="type"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      class="input"
      :class="error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : ''"
    />
    <p v-if="error" class="mt-1.5 text-xs font-medium text-red-600">{{ error }}</p>
    <p v-else-if="hint" class="mt-1.5 text-xs text-stone-400">{{ hint }}</p>
  </div>
</template>
