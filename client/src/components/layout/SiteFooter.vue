<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/stores/auth'

withDefaults(defineProps<{ compact?: boolean }>(), {
  compact: false,
})

const auth = useAuthStore()
const currentYear = new Date().getFullYear()
const showOrders = computed(() => auth.role === 'CUSTOMER')
</script>

<template>
  <footer v-if="compact" class="border-t border-ink-900/10 bg-white py-6">
    <div
      class="container-page flex flex-col gap-2 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>© {{ currentYear }} Savora. Hyper-local food rescue Malang.</p>
      <div class="flex flex-wrap gap-x-4 gap-y-1">
        <RouterLink to="/" class="font-semibold transition hover:text-ink-900">Home</RouterLink>
        <RouterLink to="/catalog" class="font-semibold transition hover:text-ink-900">
          Katalog
        </RouterLink>
        <RouterLink
          v-if="showOrders"
          to="/orders"
          class="font-semibold transition hover:text-ink-900"
        >
          Pesanan saya
        </RouterLink>
      </div>
    </div>
  </footer>

  <footer v-else class="border-t border-ink-900/10 bg-white">
    <div class="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
      <div>
        <p class="text-lg font-extrabold tracking-tight text-ink-950">Savora</p>
        <p class="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
          Marketplace food rescue hyper-local di Malang. Selamatkan makanan layak konsumsi, hemat
          sampai 70 persen.
        </p>
      </div>

      <div>
        <p class="text-sm font-extrabold text-ink-950">Jelajahi</p>
        <div class="mt-4 flex flex-col gap-2.5 text-sm text-ink-600">
          <RouterLink to="/" class="transition hover:text-ink-950">Home</RouterLink>
          <RouterLink to="/catalog" class="transition hover:text-ink-950">Katalog toko</RouterLink>
          <RouterLink v-if="showOrders" to="/orders" class="transition hover:text-ink-950">
            Pesanan saya
          </RouterLink>
        </div>
      </div>

      <div>
        <p class="text-sm font-extrabold text-ink-950">Area layanan</p>
        <p class="mt-4 text-sm leading-relaxed text-ink-500">
          Lowokwaru, Klojen, Blimbing, Sukun, Sawojajar.
        </p>
      </div>
    </div>

    <div class="border-t border-ink-900/10 py-5">
      <div
        class="container-page flex flex-col gap-1 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© {{ currentYear }} Savora. Dibuat untuk portofolio pengembangan web.</p>
        <p>Foto ilustrasi: Unsplash.</p>
      </div>
    </div>
  </footer>
</template>
