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
  <div class="flex min-h-screen flex-col bg-stone-100">
    <header class="border-b border-stone-200 bg-white">
      <div class="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        <RouterLink to="/merchant" class="flex items-center gap-2.5">
          <span class="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-base font-extrabold text-white">S</span>
          <div class="leading-tight">
            <p class="text-sm font-extrabold text-stone-900">Savora</p>
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-700">Mitra</p>
          </div>
        </RouterLink>

        <nav class="flex items-center gap-0.5 sm:gap-1">
          <RouterLink
            to="/merchant"
            class="rounded-lg px-2 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 sm:px-3 sm:text-sm"
            exact-active-class="bg-brand-50 text-brand-800"
          >
            Dasbor
          </RouterLink>
          <RouterLink
            to="/merchant/stock"
            class="rounded-lg px-2 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 sm:px-3 sm:text-sm"
            active-class="bg-brand-50 text-brand-800"
          >
            Stok
          </RouterLink>
          <RouterLink
            to="/merchant/verify"
            class="rounded-lg px-2 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 sm:px-3 sm:text-sm"
            active-class="bg-brand-50 text-brand-800"
          >
            Verifikasi
          </RouterLink>
          <RouterLink
            to="/catalog"
            class="hidden rounded-lg px-3 py-2 text-sm font-semibold text-stone-500 transition hover:bg-stone-100 sm:block"
          >
            Katalog
          </RouterLink>
        </nav>

        <div class="flex items-center gap-2">
          <span class="hidden max-w-[12rem] truncate text-xs font-semibold text-stone-500 sm:block">
            {{ auth.user?.name }}
          </span>
          <button
            type="button"
            class="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-500 transition hover:border-red-200 hover:text-red-600"
            @click="logout"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <RouterView />
      </div>
    </main>

    <footer class="border-t border-stone-200 bg-white py-5">
      <p class="mx-auto max-w-5xl px-4 text-xs text-stone-400 sm:px-6">
        Akun mitra dikelola admin Savora. Hubungi admin jika ada perubahan data toko.
      </p>
    </footer>
  </div>
</template>
