<script setup lang="ts">
const methods = [
  {
    id: 'QRIS',
    label: 'QRIS',
    description: 'Scan dengan semua aplikasi pembayaran',
    icon: '▦',
  },
  {
    id: 'EWALLET',
    label: 'E-Wallet',
    description: 'GoPay, OVO, DANA, ShopeePay',
    icon: '▤',
  },
] as const

const model = defineModel<'QRIS' | 'EWALLET'>({ default: 'QRIS' })
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-2">
    <button
      v-for="method in methods"
      :key="method.id"
      type="button"
      class="flex items-start gap-3 rounded-2xl border p-4 text-left transition"
      :class="
        model === method.id
          ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
          : 'border-stone-200 bg-white hover:border-brand-300'
      "
      @click="model = method.id"
    >
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-lg text-brand-700 shadow-sm">
        {{ method.icon }}
      </span>
      <span>
        <span class="block text-sm font-bold text-stone-900">{{ method.label }}</span>
        <span class="mt-0.5 block text-xs leading-relaxed text-stone-500">{{ method.description }}</span>
      </span>
    </button>
  </div>
</template>
