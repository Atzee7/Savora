<script setup lang="ts">
import { ref } from 'vue'

import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const mobileMenuOpen = ref(false)
const currentYear = new Date().getFullYear()

function closeMenu(): void {
  mobileMenuOpen.value = false
}

function logout(): void {
  auth.logout()
  closeMenu()
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
      <div class="container-page flex h-16 items-center justify-between gap-4">
        <RouterLink to="/" class="flex items-center gap-2.5" @click="closeMenu">
          <span class="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-base font-extrabold text-white">S</span>
          <span class="text-lg font-extrabold tracking-tight text-stone-900">Savora</span>
        </RouterLink>

        <nav class="hidden items-center gap-7 md:flex">
          <RouterLink to="/catalog" class="text-sm font-semibold text-stone-600 transition hover:text-brand-700">
            Katalog
          </RouterLink>
          <a href="/#cara-kerja" class="text-sm font-semibold text-stone-600 transition hover:text-brand-700">
            Cara Kerja
          </a>
          <a href="/#untuk-mitra" class="text-sm font-semibold text-stone-600 transition hover:text-brand-700">
            Untuk Mitra
          </a>
        </nav>

        <div class="hidden items-center gap-3 md:flex">
          <template v-if="auth.isAuthenticated">
            <RouterLink to="/orders" class="text-sm font-semibold text-stone-600 transition hover:text-brand-700">
              Pesanan
            </RouterLink>
            <button type="button" class="link-muted" @click="logout">Keluar</button>
          </template>
          <template v-else>
            <RouterLink to="/auth/login" class="text-sm font-semibold text-stone-600 transition hover:text-brand-700">
              Masuk
            </RouterLink>
            <RouterLink
              to="/auth/register"
              class="inline-flex items-center justify-center rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Daftar
            </RouterLink>
          </template>
        </div>

        <button
          type="button"
          class="grid h-10 w-10 place-items-center rounded-xl border border-stone-200 text-stone-600 md:hidden"
          :aria-expanded="mobileMenuOpen"
          aria-label="Buka menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span v-if="!mobileMenuOpen" class="space-y-1">
            <span class="block h-0.5 w-5 bg-current" />
            <span class="block h-0.5 w-5 bg-current" />
            <span class="block h-0.5 w-5 bg-current" />
          </span>
          <span v-else class="text-lg leading-none">×</span>
        </button>
      </div>

      <div v-if="mobileMenuOpen" class="border-t border-stone-200 bg-stone-50 md:hidden">
        <div class="container-page flex flex-col gap-1 py-3">
          <RouterLink to="/catalog" class="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-brand-50" @click="closeMenu">
            Katalog
          </RouterLink>
          <a href="/#cara-kerja" class="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-brand-50" @click="closeMenu">
            Cara Kerja
          </a>
          <a href="/#untuk-mitra" class="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-brand-50" @click="closeMenu">
            Untuk Mitra
          </a>
          <div class="my-2 border-t border-stone-200" />
          <template v-if="auth.isAuthenticated">
            <RouterLink to="/orders" class="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-brand-50" @click="closeMenu">
              Pesanan
            </RouterLink>
            <button type="button" class="rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50" @click="logout">
              Keluar
            </button>
          </template>
          <template v-else>
            <RouterLink to="/auth/login" class="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-brand-50" @click="closeMenu">
              Masuk
            </RouterLink>
            <RouterLink to="/auth/register" class="rounded-xl px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-50" @click="closeMenu">
              Daftar
            </RouterLink>
          </template>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t border-stone-200 bg-white">
      <div class="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div class="sm:col-span-2">
          <div class="flex items-center gap-2.5">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-sm font-extrabold text-white">S</span>
            <span class="text-base font-extrabold text-stone-900">Savora</span>
          </div>
          <p class="mt-3 max-w-sm text-sm leading-relaxed text-stone-500">
            Marketplace food rescue hyper-local di Malang. Selamatkan makanan layak konsumsi, hemat sampai 70%.
          </p>
        </div>
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-stone-400">Jelajahi</p>
          <div class="mt-3 flex flex-col gap-2 text-sm text-stone-600">
            <RouterLink to="/catalog" class="hover:text-brand-700">Katalog toko</RouterLink>
            <a href="/#cara-kerja" class="hover:text-brand-700">Cara kerja</a>
            <a href="/#untuk-mitra" class="hover:text-brand-700">Untuk mitra</a>
          </div>
        </div>
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-stone-400">Area layanan</p>
          <p class="mt-3 text-sm leading-relaxed text-stone-500">
            Lowokwaru · Klojen · Blimbing · Sukun · Sawojajar
          </p>
        </div>
      </div>
      <div class="border-t border-stone-100 py-5">
        <p class="container-page text-xs text-stone-400">
          © {{ currentYear }} Savora. Dibuat untuk portofolio pengembangan web.
        </p>
      </div>
    </footer>
  </div>
</template>
