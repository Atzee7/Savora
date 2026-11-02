<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

async function logout(): Promise<void> {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-stone-100 lg:grid lg:grid-cols-[16rem_1fr]">
    <aside class="hidden border-r border-stone-800 bg-stone-950 text-stone-300 lg:flex lg:flex-col">
      <div class="flex h-16 items-center gap-3 border-b border-stone-800 px-5">
        <span class="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-base font-extrabold text-stone-950">
          S
        </span>
        <div class="leading-tight">
          <p class="text-sm font-extrabold text-white">Savora</p>
          <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-400">Admin console</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-5">
        <p class="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Operasional</p>
        <RouterLink
          to="/admin"
          class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-300 transition hover:bg-stone-900 hover:text-white"
          exact-active-class="bg-stone-800 text-white"
        >
          Mitra &amp; toko
          <span class="rounded bg-brand-500/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-400">Admin</span>
        </RouterLink>
        <RouterLink
          to="/admin/monitoring"
          class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-300 transition hover:bg-stone-900 hover:text-white"
          active-class="bg-stone-800 text-white"
        >
          Monitoring &amp; red flag
          <span class="text-xs text-stone-600">📡</span>
        </RouterLink>
        <RouterLink
          to="/catalog"
          class="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-stone-400 transition hover:bg-stone-900 hover:text-white"
        >
          Katalog publik
          <span class="text-xs text-stone-600">↗</span>
        </RouterLink>
      </nav>

      <div class="border-t border-stone-800 p-4">
        <p class="truncate text-sm font-semibold text-white">{{ auth.user?.name ?? 'Admin' }}</p>
        <p class="mt-0.5 truncate text-[11px] text-stone-500">{{ auth.user?.email }}</p>
        <button
          type="button"
          class="mt-3 w-full rounded-lg border border-stone-800 px-3 py-2 text-xs font-semibold text-stone-400 transition hover:border-red-900 hover:text-red-400"
          @click="logout"
        >
          Keluar dari akun
        </button>
      </div>
    </aside>

    <div class="flex min-h-screen flex-col">
      <header class="border-b border-stone-200 bg-white lg:hidden">
        <div class="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <RouterLink to="/admin" class="flex items-center gap-2.5">
            <span class="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-base font-extrabold text-white">S</span>
            <span class="text-sm font-extrabold text-stone-900">Admin</span>
          </RouterLink>
          <div class="flex items-center gap-3">
            <RouterLink to="/admin/monitoring" class="text-xs font-semibold text-stone-500">Monitoring</RouterLink>
            <RouterLink to="/catalog" class="text-xs font-semibold text-stone-500">Katalog</RouterLink>
            <button
              type="button"
              class="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-500"
              @click="logout"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main class="flex-1">
        <RouterView />
      </main>

      <footer class="border-t border-stone-200 px-4 py-4 text-[11px] text-stone-400 sm:px-6 lg:px-8">
        Savora admin · data lokal PostgreSQL · {{ new Date().getFullYear() }}
      </footer>
    </div>
  </div>
</template>
