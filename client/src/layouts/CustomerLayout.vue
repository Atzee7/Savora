<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-40 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between gap-4">
        <RouterLink to="/" class="flex items-center gap-2.5">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-base font-extrabold text-white">S</span>
          <span class="hidden text-lg font-extrabold tracking-tight text-stone-900 sm:block">Savora</span>
        </RouterLink>

        <nav class="flex items-center gap-1 sm:gap-2">
          <RouterLink to="/catalog" class="rounded-full px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-brand-700">
            Katalog
          </RouterLink>
          <RouterLink to="/orders" class="rounded-full px-3 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-brand-700">
            Pesanan
          </RouterLink>
        </nav>

        <div class="flex items-center gap-2">
          <span class="hidden max-w-[14rem] truncate text-sm font-semibold text-stone-600 sm:block">
            {{ auth.user?.name ?? 'Akun saya' }}
          </span>
          <button
            type="button"
            class="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-500 transition hover:border-red-200 hover:text-red-600"
            @click="auth.logout()"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <div class="container-page py-8 sm:py-10">
        <RouterView />
      </div>
    </main>

    <footer class="border-t border-stone-200 bg-white py-6">
      <div class="container-page flex flex-col gap-2 text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ new Date().getFullYear() }} Savora — hyper-local food rescue Malang.</p>
        <RouterLink to="/" class="font-semibold hover:text-brand-700">Kembali ke beranda</RouterLink>
      </div>
    </footer>
  </div>
</template>
