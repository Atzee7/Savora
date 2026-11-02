<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AccountMenu from '@/components/layout/AccountMenu.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const root = ref<HTMLElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const mobileOpen = ref(false)

const isHome = computed(() => route.path === '/')
const isCatalog = computed(
  () => route.path === '/catalog' || route.path.startsWith('/stores/'),
)

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

const isDashboard = computed(() => {
  const path = dashboardPath.value
  return route.path === path || route.path.startsWith(`${path}/`)
})

function navClass(active: boolean): string[] {
  return [
    'relative py-1.5 text-sm font-semibold transition',
    active
      ? 'text-ink-950 after:absolute after:-bottom-0.5 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-ink-900'
      : 'text-ink-600 hover:text-ink-900',
  ]
}

function mobileNavClass(active: boolean): string[] {
  return [
    'flex min-h-11 items-center justify-between gap-3 rounded-xl px-2.5 text-sm font-semibold transition',
    active
      ? 'bg-white text-ink-950 shadow-sm ring-1 ring-ink-900/10'
      : 'text-ink-700 hover:bg-sage-200/70 hover:text-ink-950',
  ]
}

function closeMobile(): void {
  mobileOpen.value = false
}

async function logout(): Promise<void> {
  auth.logout()
  closeMobile()
  await router.push('/')
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (!mobileOpen.value) {
    return
  }

  if (root.value && !root.value.contains(event.target as Node)) {
    closeMobile()
  }
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !mobileOpen.value) {
    return
  }

  closeMobile()
  menuButton.value?.focus()
}

watch(
  () => route.fullPath,
  () => {
    closeMobile()
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
  <header
    ref="root"
    class="sticky top-0 z-40 border-b border-ink-900/10 bg-sage-100/85 backdrop-blur"
  >
    <div class="container-page flex h-[4.5rem] items-center gap-6">
      <RouterLink
        to="/"
        class="shrink-0 text-xl font-extrabold tracking-tight text-ink-950"
        @click="closeMobile"
      >
        Savora
      </RouterLink>

      <nav class="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
        <RouterLink to="/" :class="navClass(isHome)">Home</RouterLink>
        <RouterLink to="/catalog" :class="navClass(isCatalog)">Katalog</RouterLink>
      </nav>

      <div class="ml-auto flex items-center gap-2">
        <div class="hidden items-center gap-2 md:flex">
          <template v-if="auth.isAuthenticated">
            <AccountMenu />
          </template>
          <template v-else>
            <RouterLink
              to="/auth/login"
              class="rounded-full px-3 py-2.5 text-sm font-semibold text-ink-600 transition hover:bg-sage-200/70 hover:text-ink-950"
            >
              Masuk
            </RouterLink>
            <RouterLink
              to="/auth/register"
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
            >
              Daftar
            </RouterLink>
          </template>
        </div>

        <button
          ref="menuButton"
          type="button"
          class="grid h-11 w-11 place-items-center rounded-xl border border-ink-900/10 bg-white text-ink-700 transition hover:border-ink-900/25 hover:text-ink-950 md:hidden"
          :aria-expanded="mobileOpen"
          aria-controls="mobile-navigation"
          :aria-label="mobileOpen ? 'Tutup menu' : 'Buka menu'"
          @click="mobileOpen = !mobileOpen"
        >
          <span v-if="!mobileOpen" class="space-y-1" aria-hidden="true">
            <span class="block h-0.5 w-5 rounded bg-current" />
            <span class="block h-0.5 w-5 rounded bg-current" />
            <span class="block h-0.5 w-5 rounded bg-current" />
          </span>
          <span v-else class="text-xl leading-none" aria-hidden="true">×</span>
        </button>
      </div>
    </div>

    <nav
      v-if="mobileOpen"
      id="mobile-navigation"
      aria-label="Navigasi seluler"
      class="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-ink-900/10 bg-sage-100 shadow-sm md:hidden"
    >
      <div class="px-2.5 py-4">
        <p class="px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600">Jelajahi</p>

        <div class="mt-1.5 flex flex-col gap-1">
          <RouterLink to="/" :class="mobileNavClass(isHome)" @click="closeMobile">
            <span>Home</span>
            <span
              v-if="isHome"
              class="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-700"
            >
              Sekarang
            </span>
          </RouterLink>

          <RouterLink to="/catalog" :class="mobileNavClass(isCatalog)" @click="closeMobile">
            <span>Katalog</span>
            <span
              v-if="isCatalog"
              class="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-700"
            >
              Sekarang
            </span>
          </RouterLink>
        </div>

        <div class="mx-2.5 my-4 border-t border-dashed border-ink-900/15" aria-hidden="true" />

        <p class="px-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600">Akun</p>

        <template v-if="auth.isAuthenticated">
          <div class="mt-2 rounded-xl border border-ink-900/10 bg-white px-2.5 py-3">
            <p class="truncate text-sm font-extrabold text-ink-950">{{ auth.user?.name }}</p>
            <p class="mt-0.5 truncate text-xs text-ink-600">{{ auth.user?.email }}</p>
          </div>

          <div class="mt-2 flex flex-col gap-1">
            <RouterLink
              :to="dashboardPath"
              :class="mobileNavClass(isDashboard)"
              @click="closeMobile"
            >
              <span>{{ dashboardLabel }}</span>
              <span
                v-if="isDashboard"
                class="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-700"
              >
                Sekarang
              </span>
            </RouterLink>

            <button
              type="button"
              class="flex min-h-11 items-center rounded-xl px-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
              @click="logout"
            >
              Keluar
            </button>
          </div>
        </template>

        <template v-else>
          <div class="mt-2 flex flex-col gap-2">
            <RouterLink
              to="/auth/login"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-900/15 bg-white px-4 text-sm font-bold text-ink-900 transition hover:border-ink-900/30 hover:bg-sage-100"
              @click="closeMobile"
            >
              Masuk
            </RouterLink>

            <RouterLink
              to="/auth/register"
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-4 text-sm font-bold text-white transition hover:bg-ink-800"
              @click="closeMobile"
            >
              Daftar
            </RouterLink>
          </div>
        </template>
      </div>
    </nav>
  </header>
</template>
