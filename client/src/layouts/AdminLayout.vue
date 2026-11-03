<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const name = auth.user?.name?.trim()

  if (!name) {
    return 'A'
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
})

const currentYear = new Date().getFullYear()

const navItems = [
  { to: '/admin', label: 'Mitra & toko', exact: true },
  { to: '/admin/monitoring', label: 'Monitoring & red flag', exact: false },
]

async function logout(): Promise<void> {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-sage-100">
    <header class="sticky top-0 z-40 border-b border-ink-900/10 bg-sage-100/85 backdrop-blur">
      <div class="container-page flex h-[4.5rem] items-center gap-4">
        <RouterLink to="/admin" class="flex shrink-0 items-center gap-2">
          <span class="text-xl font-extrabold tracking-tight text-ink-950">Savora</span>
          <span
            class="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white"
          >
            Admin
          </span>
        </RouterLink>

        <nav class="ml-4 hidden items-center gap-1 md:flex" aria-label="Navigasi admin">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="rounded-full px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-sage-200/70 hover:text-ink-950"
            :exact-active-class="item.exact ? 'bg-ink-900 text-white hover:bg-ink-800 hover:text-white' : ''"
            :active-class="item.exact ? '' : 'bg-ink-900 text-white hover:bg-ink-800 hover:text-white'"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="ml-auto flex items-center gap-2">
          <RouterLink
            to="/catalog"
            class="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink-600 transition hover:bg-sage-200/70 hover:text-ink-950 lg:inline-flex"
          >
            Lihat katalog
          </RouterLink>

          <div class="hidden items-center gap-2.5 sm:flex">
            <span
              class="grid h-9 w-9 place-items-center rounded-full border border-ink-900/10 bg-white text-[11px] font-extrabold text-ink-800"
              aria-hidden="true"
            >
              {{ initials }}
            </span>
            <div class="hidden leading-tight lg:block">
              <p class="max-w-[10rem] truncate text-xs font-bold text-ink-950">
                {{ auth.user?.name }}
              </p>
              <p class="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">Admin</p>
            </div>
          </div>

          <button
            type="button"
            class="inline-flex min-h-10 items-center justify-center rounded-full border border-ink-900/15 bg-white px-3.5 py-2 text-xs font-semibold text-ink-800 transition hover:border-ink-900/30 hover:bg-sage-100"
            @click="logout"
          >
            Keluar
          </button>
        </div>
      </div>

      <nav
        class="container-page no-scrollbar flex gap-1 overflow-x-auto pb-3 md:hidden"
        aria-label="Navigasi admin"
      >
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-sage-200/70 hover:text-ink-950"
          :exact-active-class="item.exact ? 'bg-ink-900 text-white' : ''"
          :active-class="item.exact ? '' : 'bg-ink-900 text-white'"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>

    <main class="flex-1">
      <div class="container-page py-8 sm:py-10">
        <RouterView />
      </div>
    </main>

    <footer class="border-t border-ink-900/10 bg-white">
      <div
        class="container-page flex flex-col gap-2 py-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© {{ currentYear }} Savora Admin. Operasional mitra dan monitoring Malang.</p>
        <p>Data lokal PostgreSQL · perhitungan hari berjalan WIB.</p>
      </div>
    </footer>
  </div>
</template>
