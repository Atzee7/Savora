<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const open = ref(false)

const initial = computed(() => auth.user?.name?.trim().charAt(0).toUpperCase() || 'S')
const firstName = computed(() => auth.user?.name?.trim().split(/\s+/)[0] ?? 'Akun')

const dashboardPath = computed(() => {
  if (auth.role === 'ADMIN') {
    return '/admin'
  }

  if (auth.role === 'MERCHANT') {
    return '/merchant'
  }

  return '/orders'
})

const dashboardLabel = computed(() => {
  if (auth.role === 'ADMIN') {
    return 'Dasbor admin'
  }

  if (auth.role === 'MERCHANT') {
    return 'Dasbor mitra'
  }

  return 'Pesanan saya'
})

async function logout(): Promise<void> {
  auth.logout()
  open.value = false
  await router.push('/')
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!open.value) {
    return
  }

  if (root.value && !root.value.contains(event.target as Node)) {
    open.value = false
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !open.value) {
    return
  }

  open.value = false
  nextTick(() => trigger.value?.focus())
}

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)

onMounted(() => {
  document.addEventListener('pointerdown', onDocumentPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocumentPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="trigger"
      type="button"
      class="flex h-11 items-center gap-2 rounded-full border border-ink-900/10 bg-white px-2 text-left transition hover:border-ink-900/25"
      :aria-expanded="open"
      aria-haspopup="true"
      aria-controls="account-menu"
      @click="open = !open"
    >
      <span
        class="grid h-8 w-8 place-items-center rounded-full bg-sage-300 text-xs font-extrabold text-ink-900"
      >
        {{ initial }}
      </span>
      <span class="hidden max-w-[9rem] truncate text-sm font-semibold text-ink-700 sm:block">
        {{ firstName }}
      </span>
      <svg
        class="mr-1 h-4 w-4 text-ink-400 transition"
        :class="open ? 'rotate-180' : ''"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        aria-hidden="true"
      >
        <path d="M5 8l5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div
      v-if="open"
      id="account-menu"
      class="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-900/10 bg-white shadow-float"
    >
      <div class="border-b border-ink-900/10 px-4 py-3.5">
        <p class="truncate text-sm font-extrabold text-ink-950">{{ auth.user?.name ?? 'Akun saya' }}</p>
        <p class="mt-0.5 truncate text-xs text-ink-500">{{ auth.user?.email }}</p>
      </div>

      <div class="p-1.5">
        <RouterLink
          :to="dashboardPath"
          class="block rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-sage-100 hover:text-ink-950"
          @click="open = false"
        >
          {{ dashboardLabel }}
        </RouterLink>
        <button
          type="button"
          class="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
          @click="logout"
        >
          Keluar
        </button>
      </div>
    </div>
  </div>
</template>
