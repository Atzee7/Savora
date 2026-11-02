<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
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
const errorId = `${id}-error`
const hintId = `${id}-hint`

const describedBy = computed(() => {
  if (props.error) {
    return errorId
  }

  return props.hint ? hintId : undefined
})
</script>

<template>
  <div>
    <label v-if="label" :for="id" class="label">{{ label }}</label>
    <div class="relative">
      <input
        :id="id"
        v-model="model"
        v-bind="$attrs"
        :type="type"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :required="required"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="describedBy"
        class="input"
        :class="[error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : '', $slots.trailing ? '!pr-12' : '']"
      />
      <div v-if="$slots.trailing" class="absolute inset-y-0 right-1 flex items-center">
        <slot name="trailing" />
      </div>
    </div>
    <p v-if="error" :id="errorId" class="mt-1.5 text-xs font-medium text-red-700">{{ error }}</p>
    <p v-else-if="hint" :id="hintId" class="mt-1.5 text-xs leading-relaxed text-ink-600">
      {{ hint }}
    </p>
  </div>
</template>
