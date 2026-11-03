<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
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

async function load(options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true

  if (!silent) {
    loading.value = true
    loadError.value = ''
  }

  try {
    overview.value = await adminService.getOverview()
    loadError.value = ''
    lastUpdated.value = new Date()
  } catch (error) {
    if (silent) {
      // Biarkan data terakhir tampil; badge tidak diperbarui pada percobaan gagal.
      throw error
    }

    overview.value = null
    loadError.value = getErrorMessage(error, 'Data monitoring belum bisa dimuat.')
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

const { lastUpdated, refresh } = useAutoRefresh(() => load({ silent: true }), {
  interval: 20_000,
  enabled: () => !loading.value && actioningId.value === null,
})

async function changeStatus(
  store: AdminFlaggedStore,
  status: 'ACTIVE' | 'SUSPENDED',
): Promise<void> {
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
    lastUpdated.value = new Date()
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
  <div>
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
          Operasional / Monitoring
        </p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
          Monitoring &amp; red flag
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
          Pantau transaksi harian dan kualitas mitra. Toko dengan lebih dari 20% ulasan “Tidak
          sesuai” otomatis masuk peringatan.
        </p>
        <div class="mt-4">
          <LiveBadge :updated-at="lastUpdated" label="Otomatis" />
        </div>
      </div>

      <AppButton variant="secondary" size="md" @click="refresh()">Muat ulang data</AppButton>
    </header>

    <div v-if="loading" class="mt-8 space-y-5">
      <div class="h-32 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="h-24 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="h-64 animate-pulse rounded-[2rem] bg-sage-200" />
    </div>

    <div v-else-if="loadError || !overview || !stats" class="mt-8">
      <EmptyState title="Monitoring belum bisa dimuat" :description="loadError">
        <template #icon>📡</template>
        <template #action>
          <AppButton variant="ink" @click="load()">Coba lagi</AppButton>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <section
        class="mt-8 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-ink-900/10 shadow-card"
      >
        <div class="grid grid-cols-2 gap-px lg:grid-cols-4">
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Pesanan hari ini
            </p>
            <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
              {{ stats.ordersToday }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">{{ stats.completedToday }} selesai diverifikasi</p>
          </div>
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Omzet selesai
            </p>
            <p class="mt-2 truncate text-2xl font-extrabold tracking-tight text-brand-700">
              {{ formatRupiah(stats.revenueToday) }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">Dari pesanan selesai hari ini</p>
          </div>
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Toko peringatan
            </p>
            <p
              class="mt-2 text-2xl font-extrabold tracking-tight"
              :class="stats.warningStores > 0 ? 'text-red-700' : 'text-ink-950'"
            >
              {{ stats.warningStores }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">{{ stats.suspendedStores }} ditangguhkan</p>
          </div>
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Ulasan tidak sesuai
            </p>
            <p
              class="mt-2 text-2xl font-extrabold tracking-tight"
              :class="stats.unsatisfiedRate > 20 ? 'text-red-700' : 'text-ink-950'"
            >
              {{ formatRate(stats.unsatisfiedRate) }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">
              {{ stats.unsatisfiedCount }} dari {{ stats.feedbackTotal }} ulasan
            </p>
          </div>
        </div>
      </section>

      <section
        class="mt-4 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-ink-900/10 shadow-card"
      >
        <div class="grid grid-cols-2 gap-px lg:grid-cols-4">
          <div class="bg-white px-5 py-4 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Mitra</p>
            <p class="mt-1 text-lg font-extrabold tracking-tight text-ink-950">
              {{ stats.totalMerchants }}
            </p>
          </div>
          <div class="bg-white px-5 py-4 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Customer</p>
            <p class="mt-1 text-lg font-extrabold tracking-tight text-ink-950">
              {{ stats.totalCustomers }}
            </p>
          </div>
          <div class="bg-white px-5 py-4 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Toko aktif</p>
            <p class="mt-1 text-lg font-extrabold tracking-tight text-brand-700">
              {{ stats.activeStores }}<span class="text-xs font-semibold text-ink-500"> / {{ stats.totalStores }}</span>
            </p>
          </div>
          <div class="bg-white px-5 py-4 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Total stok</p>
            <p class="mt-1 text-lg font-extrabold tracking-tight text-ink-950">
              {{ stats.totalStock }} kantong
            </p>
          </div>
        </div>
      </section>

      <div
        v-if="actionError"
        class="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        role="alert"
      >
        {{ actionError }}
      </div>
      <div
        v-if="actionSuccess"
        class="mt-5 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
        role="status"
      >
        {{ actionSuccess }}
      </div>

      <section class="mt-8">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
              Perlu perhatian
            </p>
            <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
              Toko dengan red flag
            </h2>
            <p class="mt-1 max-w-2xl text-xs leading-relaxed text-ink-600">
              Toko WARNING tetap tampil di katalog. Suspend menghilangkan toko dari katalog dan
              checkout.
            </p>
          </div>
          <span class="rounded-full bg-sage-200 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            {{ overview.flaggedStores.length }} toko
          </span>
        </div>

        <div
          v-if="overview.flaggedStores.length === 0"
          class="mt-4 rounded-[2rem] border border-dashed border-ink-900/15 bg-white px-6 py-12 text-center"
        >
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-2xl">
            🌿
          </span>
          <p class="mt-4 text-sm font-extrabold text-ink-950">Tidak ada toko dengan red flag</p>
          <p class="mt-1 text-xs leading-relaxed text-ink-600">
            Semua mitra berada di bawah ambang 20% ulasan “Tidak sesuai”.
          </p>
        </div>

        <div v-else class="mt-4 grid gap-4 lg:grid-cols-2">
          <article
            v-for="store in overview.flaggedStores"
            :key="store.id"
            class="rounded-[2rem] border border-ink-900/10 bg-white p-5 shadow-card sm:p-6"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="truncate text-base font-extrabold tracking-tight text-ink-950">
                    {{ store.storeName }}
                  </h3>
                  <StatusBadge :status="store.status" />
                </div>
                <p class="mt-1 text-xs text-ink-600">{{ store.ownerName }} · {{ store.ownerEmail }}</p>
                <p class="mt-0.5 text-xs leading-relaxed text-ink-500">{{ store.address }}</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Stok</p>
                <p class="text-lg font-extrabold tracking-tight text-ink-950">{{ store.totalStock }}</p>
              </div>
            </div>

            <div class="mt-4 rounded-2xl bg-sage-50 px-4 py-3.5">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs font-bold text-ink-700">Rasio ulasan tidak sesuai</p>
                <p
                  class="text-sm font-extrabold"
                  :class="store.feedback.rate > 20 ? 'text-red-700' : 'text-ink-900'"
                >
                  {{ formatRate(store.feedback.rate) }}
                </p>
              </div>
              <div class="mt-2 h-2 overflow-hidden rounded-full bg-sage-200">
                <div
                  class="h-full rounded-full transition-all"
                  :class="store.feedback.rate > 20 ? 'bg-red-600' : 'bg-brand-500'"
                  :style="{ width: `${Math.min(100, store.feedback.rate)}%` }"
                />
              </div>
              <p class="mt-2 text-[11px] text-ink-600">
                {{ store.feedback.unsatisfied }} tidak sesuai dari {{ store.feedback.total }} ulasan
                <template v-if="store.feedback.total === 0"> · belum ada ulasan</template>
              </p>
            </div>

            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <AppButton
                variant="primary"
                size="sm"
                class="flex-1"
                :loading="actioningId === store.id"
                :disabled="actioningId !== null"
                @click="changeStatus(store, 'ACTIVE')"
              >
                {{ store.status === 'SUSPENDED' ? 'Aktifkan kembali' : 'Pulihkan ke aktif' }}
              </AppButton>
              <button
                v-if="store.status === 'WARNING'"
                type="button"
                class="inline-flex flex-1 items-center justify-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="actioningId !== null"
                @click="changeStatus(store, 'SUSPENDED')"
              >
                Suspend toko
              </button>
            </div>
          </article>
        </div>
      </section>

      <section
        class="mt-6 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-b border-ink-900/10 px-5 py-5 sm:px-6"
        >
          <div>
            <h2 class="text-lg font-extrabold tracking-tight text-ink-950">Transaksi terbaru</h2>
            <p class="mt-0.5 text-xs text-ink-600">10 pesanan terakhir dari seluruh toko</p>
          </div>
          <RouterLink
            to="/admin"
            class="text-xs font-bold text-brand-700 transition hover:text-brand-800 hover:underline"
          >
            Kelola mitra →
          </RouterLink>
        </div>

        <div v-if="overview.recentOrders.length === 0" class="px-6 py-12 text-center">
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-2xl">
            🧾
          </span>
          <p class="mt-4 text-sm font-extrabold text-ink-950">Belum ada transaksi</p>
          <p class="mt-1 text-xs leading-relaxed text-ink-600">
            Pesanan customer akan muncul di sini setelah checkout.
          </p>
        </div>

        <div v-else class="divide-y divide-ink-900/10">
          <article
            v-for="order in overview.recentOrders"
            :key="order.id"
            class="flex flex-col gap-2 px-5 py-4 transition hover:bg-sage-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-extrabold text-ink-950">{{ order.storeName }}</p>
                <StatusBadge :status="order.status" />
                <span class="font-mono text-[11px] font-semibold text-ink-500">
                  {{ order.id.slice(0, 8).toUpperCase() }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-ink-600">
                {{ order.customerName }} · {{ tierLabels[order.tierName] }} × {{ order.qty }} ·
                {{ formatDate(order.createdAt) }}
              </p>
            </div>
            <p class="shrink-0 text-sm font-extrabold text-ink-900">
              {{ formatRupiah(order.totalPrice) }}
            </p>
          </article>
        </div>
      </section>

      <div class="mt-5 rounded-[2rem] border border-sage-300 bg-sage-200/70 px-5 py-4 text-xs leading-relaxed text-ink-700">
        <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-800">
          Cara kerja red flag
        </p>
        <p class="mt-2">
          Ambang dihitung dari seluruh ulasan toko. Ulasan “Tidak sesuai” di atas 20% mengubah toko
          ACTIVE menjadi WARNING secara otomatis. Admin dapat memulihkan atau menangguhkan toko
          secara manual.
        </p>
      </div>
    </template>
  </div>
</template>
