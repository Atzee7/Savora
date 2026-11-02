<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { merchantService } from '@/services/merchant.service'
import { useAuthStore } from '@/stores/auth'
import type { MerchantSummary, Store, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTime, formatTimeRange } from '@/utils/format'

const auth = useAuthStore()

const store = ref<Store | null>(null)
const summary = ref<MerchantSummary | null>(null)
const loading = ref(true)
const loadError = ref('')

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Hemat',
  REGULER: 'Reguler',
  BESAR: 'Besar',
}

const schedule = computed(() => store.value?.schedules[0] ?? null)

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    const [loadedStore, loadedSummary] = await Promise.all([
      merchantService.getStore(),
      merchantService.getSummary(),
    ])
    store.value = loadedStore
    summary.value = loadedSummary
  } catch (error) {
    loadError.value = getErrorMessage(error, 'Dasbor mitra belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-5">
      <div class="h-28 animate-pulse rounded-2xl bg-stone-200" />
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="index in 4" :key="index" class="h-28 animate-pulse rounded-xl bg-stone-200" />
      </div>
      <div class="h-64 animate-pulse rounded-2xl bg-stone-200" />
    </div>

    <div v-else-if="loadError || !store || !summary">
      <EmptyState title="Dasbor belum bisa dimuat" :description="loadError">
        <template #icon>🏪</template>
        <template #action>
          <button
            type="button"
            class="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            @click="load"
          >
            Coba lagi
          </button>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            Dasbor mitra / Hari ini
          </p>
          <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            {{ store.storeName }}
          </h1>
          <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <StatusBadge :status="store.status" />
            <span v-if="schedule">Pickup {{ formatTimeRange(schedule.pickupStart, schedule.pickupEnd) }}</span>
            <span class="text-stone-300">·</span>
            <span>{{ store.totalStock }} kantong tersedia</span>
          </div>
        </div>

        <button
          type="button"
          class="self-start rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 sm:self-auto"
          @click="load"
        >
          Muat ulang data
        </button>
      </header>

      <section class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Pendapatan hari ini</p>
          <p class="mt-2 truncate text-xl font-extrabold text-brand-800 sm:text-2xl">{{ formatRupiah(summary.revenueToday) }}</p>
          <p class="mt-1 text-[11px] text-stone-400">{{ summary.bagsToday }} kantong terjual</p>
        </div>
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Pesanan selesai</p>
          <p class="mt-2 text-xl font-extrabold text-emerald-700 sm:text-2xl">{{ summary.completedToday }}</p>
          <p class="mt-1 text-[11px] text-stone-400">Diverifikasi hari ini</p>
        </div>
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Menunggu pickup</p>
          <p class="mt-2 text-xl font-extrabold text-amber-700 sm:text-2xl">{{ summary.activePickups }}</p>
          <p class="mt-1 text-[11px] text-stone-400">Tiket PAID aktif</p>
        </div>
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Total stok</p>
          <p class="mt-2 text-xl font-extrabold text-stone-900 sm:text-2xl">{{ summary.totalStock }}</p>
          <p class="mt-1 text-[11px] text-stone-400">Semua tier</p>
        </div>
      </section>

      <section class="mt-5 grid gap-4 sm:grid-cols-2">
        <RouterLink
          to="/merchant/verify"
          class="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-brand-950 px-5 py-6 text-white transition hover:from-stone-900 hover:to-brand-900"
        >
          <div class="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[16px] border-white/5" />
          <div class="relative">
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-lg">⌨️</span>
            <h2 class="mt-4 text-lg font-extrabold">Terminal verifikasi PIN</h2>
            <p class="mt-1 max-w-xs text-sm leading-relaxed text-stone-300">
              Masukkan PIN 4 digit dari customer untuk menyelesaikan pickup.
            </p>
            <p class="mt-4 text-xs font-bold text-brand-300 group-hover:text-brand-200">Buka terminal →</p>
          </div>
        </RouterLink>

        <RouterLink
          to="/merchant/stock"
          class="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white px-5 py-6 transition hover:border-brand-200"
        >
          <div class="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand-50" />
          <div class="relative">
            <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-lg">🥐</span>
            <h2 class="mt-4 text-lg font-extrabold text-stone-900">Kelola stok &amp; jadwal</h2>
            <p class="mt-1 max-w-xs text-sm leading-relaxed text-stone-500">
              Perbarui jumlah kantong per tier dan jendela pickup harian toko.
            </p>
            <p class="mt-4 text-xs font-bold text-brand-700 group-hover:text-brand-800">Atur stok →</p>
          </div>
        </RouterLink>
      </section>

      <section class="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div class="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 class="text-sm font-extrabold text-stone-900">Pesanan hari ini</h2>
            <p class="mt-0.5 text-xs text-stone-400">10 pesanan terbaru di toko kamu</p>
          </div>
          <span class="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-bold text-stone-500">
            {{ summary.recentOrders.length }}
          </span>
        </div>

        <div v-if="summary.recentOrders.length === 0" class="px-5 py-10 text-center">
          <p class="text-2xl">🍽️</p>
          <p class="mt-2 text-sm font-bold text-stone-700">Belum ada pesanan hari ini</p>
          <p class="mt-1 text-xs text-stone-400">Pesanan customer akan muncul di sini setelah checkout.</p>
        </div>

        <div v-else class="divide-y divide-stone-100">
          <article
            v-for="order in summary.recentOrders"
            :key="order.id"
            class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-bold text-stone-900">{{ order.customerName }}</p>
                <StatusBadge :status="order.status" />
              </div>
              <p class="mt-0.5 text-xs text-stone-500">
                {{ tierLabels[order.tierName] }} × {{ order.qty }} · {{ formatTime(order.createdAt) }} WIB
                <template v-if="order.status === 'PAID' && order.expiresAt">
                  · pickup sampai {{ formatTime(order.expiresAt) }}
                </template>
              </p>
            </div>
            <p class="shrink-0 text-sm font-extrabold text-stone-700">{{ formatRupiah(order.totalPrice) }}</p>
          </article>
        </div>
      </section>

      <p class="mt-5 text-xs text-stone-400">
        Masuk sebagai {{ auth.user?.name }}. Data dihitung dari pesanan toko ini pada hari berjalan (WIB).
      </p>
    </template>
  </div>
</template>
