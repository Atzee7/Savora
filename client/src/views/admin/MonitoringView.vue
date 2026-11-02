<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { adminService } from '@/services/admin.service'
import type { AdminFlaggedStore, AdminOverview, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatRupiah } from '@/utils/format'

const overview = ref<AdminOverview | null>(null)
const loading = ref(true)
const loadError = ref('')
const actioningId = ref<string | null>(null)
const actionError = ref('')
const actionSuccess = ref('')

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Hemat',
  REGULER: 'Reguler',
  BESAR: 'Besar',
}

const stats = computed(() => overview.value?.stats ?? null)

function formatRate(value: number): string {
  return `${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(value)}%`
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    overview.value = await adminService.getOverview()
  } catch (error) {
    overview.value = null
    loadError.value = getErrorMessage(error, 'Data monitoring belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

async function changeStatus(store: AdminFlaggedStore, status: 'ACTIVE' | 'SUSPENDED'): Promise<void> {
  if (actioningId.value) {
    return
  }

  if (status === 'SUSPENDED') {
    const confirmed = window.confirm(
      `Suspend ${store.storeName}? Toko akan hilang dari katalog sampai diaktifkan kembali.`,
    )

    if (!confirmed) {
      return
    }
  }

  actioningId.value = store.id
  actionError.value = ''
  actionSuccess.value = ''

  try {
    const updated = await adminService.updateStoreStatus(store.id, status)
    actionSuccess.value = `${updated.storeName} sekarang ${
      updated.status === 'ACTIVE' ? 'aktif kembali' : 'ditangguhkan'
    }.`
    overview.value = await adminService.getOverview()
  } catch (error) {
    actionError.value = getErrorMessage(error, 'Status toko belum bisa diubah.')
  } finally {
    actioningId.value = null
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          Operasional / Monitoring
        </p>
        <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Monitoring &amp; red flag
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Pantau transaksi harian dan kualitas mitra. Toko dengan lebih dari 20% ulasan “Tidak sesuai”
          otomatis masuk peringatan.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
        @click="load"
      >
        Muat ulang data
      </button>
    </header>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="index in 4" :key="index" class="h-28 animate-pulse rounded-xl bg-stone-200" />
      </div>
      <div class="h-64 animate-pulse rounded-xl bg-stone-200" />
      <div class="h-72 animate-pulse rounded-xl bg-stone-200" />
    </div>

    <div v-else-if="loadError || !overview || !stats" class="mt-6">
      <EmptyState title="Monitoring belum bisa dimuat" :description="loadError">
        <template #icon>📡</template>
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
      <section class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Pesanan hari ini</p>
          <p class="mt-2 text-2xl font-extrabold text-stone-900">{{ stats.ordersToday }}</p>
          <p class="mt-1 text-[11px] text-stone-400">{{ stats.completedToday }} selesai diverifikasi</p>
        </div>
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Omzet selesai</p>
          <p class="mt-2 truncate text-xl font-extrabold text-brand-800 sm:text-2xl">
            {{ formatRupiah(stats.revenueToday) }}
          </p>
          <p class="mt-1 text-[11px] text-stone-400">Dari pesanan COMPLETED hari ini</p>
        </div>
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Toko peringatan</p>
          <p class="mt-2 text-2xl font-extrabold text-amber-700">{{ stats.warningStores }}</p>
          <p class="mt-1 text-[11px] text-stone-400">{{ stats.suspendedStores }} ditangguhkan</p>
        </div>
        <div class="rounded-xl border border-stone-200 bg-white px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">
            Ulasan tidak sesuai
          </p>
          <p
            class="mt-2 text-2xl font-extrabold"
            :class="stats.unsatisfiedRate > 20 ? 'text-red-600' : 'text-stone-900'"
          >
            {{ formatRate(stats.unsatisfiedRate) }}
          </p>
          <p class="mt-1 text-[11px] text-stone-400">
            {{ stats.unsatisfiedCount }} dari {{ stats.feedbackTotal }} ulasan
          </p>
        </div>
      </section>

      <section class="mt-3 grid grid-cols-2 divide-x divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white lg:grid-cols-4 lg:divide-y-0">
        <div class="px-4 py-3.5 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Mitra</p>
          <p class="mt-1 text-lg font-extrabold text-stone-900">{{ stats.totalMerchants }}</p>
        </div>
        <div class="px-4 py-3.5 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Customer</p>
          <p class="mt-1 text-lg font-extrabold text-stone-900">{{ stats.totalCustomers }}</p>
        </div>
        <div class="px-4 py-3.5 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Toko aktif</p>
          <p class="mt-1 text-lg font-extrabold text-brand-700">
            {{ stats.activeStores }}<span class="text-xs font-semibold text-stone-400"> / {{ stats.totalStores }}</span>
          </p>
        </div>
        <div class="px-4 py-3.5 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Total stok</p>
          <p class="mt-1 text-lg font-extrabold text-stone-900">{{ stats.totalStock }} kantong</p>
        </div>
      </section>

      <div
        v-if="actionError"
        class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ actionError }}
      </div>
      <div
        v-if="actionSuccess"
        class="mt-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900"
      >
        {{ actionSuccess }}
      </div>

      <section class="mt-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-extrabold uppercase tracking-[0.12em] text-stone-400">
              Toko butuh perhatian
            </h2>
            <p class="mt-1 text-xs text-stone-400">
              Toko WARNING tetap tampil di katalog. Suspend menghilangkan toko dari katalog dan checkout.
            </p>
          </div>
          <span class="rounded-full bg-stone-200 px-2.5 py-1 text-[11px] font-bold text-stone-600">
            {{ overview.flaggedStores.length }} toko
          </span>
        </div>

        <div
          v-if="overview.flaggedStores.length === 0"
          class="mt-3 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center"
        >
          <p class="text-2xl">🌿</p>
          <p class="mt-2 text-sm font-bold text-stone-700">Tidak ada toko dengan red flag</p>
          <p class="mt-1 text-xs text-stone-400">
            Semua mitra berada di bawah ambang 20% ulasan “Tidak sesuai”.
          </p>
        </div>

        <div v-else class="mt-3 grid gap-4 lg:grid-cols-2">
          <article
            v-for="store in overview.flaggedStores"
            :key="store.id"
            class="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-base font-extrabold text-stone-900">{{ store.storeName }}</h3>
                  <StatusBadge :status="store.status" />
                </div>
                <p class="mt-1 text-xs text-stone-500">{{ store.ownerName }} · {{ store.ownerEmail }}</p>
                <p class="mt-0.5 text-xs leading-relaxed text-stone-400">{{ store.address }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Stok</p>
                <p class="text-lg font-extrabold text-stone-900">{{ store.totalStock }}</p>
              </div>
            </div>

            <div class="mt-4 rounded-xl bg-stone-50 px-4 py-3.5">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-bold text-stone-700">Rasio ulasan tidak sesuai</p>
                <p
                  class="text-sm font-extrabold"
                  :class="store.feedback.rate > 20 ? 'text-red-600' : 'text-amber-700'"
                >
                  {{ formatRate(store.feedback.rate) }}
                </p>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                <div
                  class="h-full rounded-full transition-all"
                  :class="store.feedback.rate > 20 ? 'bg-red-500' : 'bg-amber-500'"
                  :style="{ width: `${Math.min(100, store.feedback.rate)}%` }"
                />
              </div>
              <p class="mt-2 text-[11px] text-stone-500">
                {{ store.feedback.unsatisfied }} tidak sesuai dari {{ store.feedback.total }} ulasan
                <template v-if="store.feedback.total === 0"> · belum ada ulasan</template>
              </p>
            </div>

            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="actioningId !== null"
                @click="changeStatus(store, 'ACTIVE')"
              >
                <span
                  v-if="actioningId === store.id"
                  class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                {{ store.status === 'SUSPENDED' ? 'Aktifkan kembali' : 'Pulihkan ke aktif' }}
              </button>
              <button
                v-if="store.status === 'WARNING'"
                type="button"
                class="inline-flex flex-1 items-center justify-center rounded-lg border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="actioningId !== null"
                @click="changeStatus(store, 'SUSPENDED')"
              >
                Suspend toko
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div>
            <h2 class="text-sm font-extrabold text-stone-900">Transaksi terbaru</h2>
            <p class="mt-0.5 text-xs text-stone-400">10 pesanan terakhir dari seluruh toko</p>
          </div>
          <RouterLink to="/admin" class="text-xs font-bold text-brand-700 hover:underline">
            Kelola mitra →
          </RouterLink>
        </div>

        <div v-if="overview.recentOrders.length === 0" class="px-5 py-10 text-center">
          <p class="text-2xl">🧾</p>
          <p class="mt-2 text-sm font-bold text-stone-700">Belum ada transaksi</p>
          <p class="mt-1 text-xs text-stone-400">Pesanan customer akan muncul di sini setelah checkout.</p>
        </div>

        <div v-else class="divide-y divide-stone-100">
          <article
            v-for="order in overview.recentOrders"
            :key="order.id"
            class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-bold text-stone-900">{{ order.storeName }}</p>
                <StatusBadge :status="order.status" />
                <span class="font-mono text-[11px] font-semibold text-stone-400">
                  {{ order.id.slice(0, 8).toUpperCase() }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-stone-500">
                {{ order.customerName }} · {{ tierLabels[order.tierName] }} × {{ order.qty }} ·
                {{ formatDate(order.createdAt) }}
              </p>
            </div>
            <p class="shrink-0 text-sm font-extrabold text-stone-700">{{ formatRupiah(order.totalPrice) }}</p>
          </article>
        </div>
      </section>

      <div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
        Ambang red flag dihitung dari seluruh ulasan toko. Ulasan “Tidak sesuai” di atas 20% mengubah toko
        ACTIVE menjadi WARNING secara otomatis. Admin dapat memulihkan atau menangguhkan toko secara manual.
      </div>
    </template>
  </div>
</template>
