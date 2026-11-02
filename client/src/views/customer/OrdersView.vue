<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatRupiah, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

const orders = ref<Order[]>([])
const loading = ref(true)
const loadError = ref('')

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Tier Hemat',
  REGULER: 'Tier Reguler',
  BESAR: 'Tier Besar',
}

const activeOrders = computed(() =>
  orders.value.filter((order) => order.status === 'PENDING' || order.status === 'PAID'),
)

const historyOrders = computed(() =>
  orders.value.filter((order) => order.status !== 'PENDING' && order.status !== 'PAID'),
)

const totalCompleted = computed(
  () => orders.value.filter((order) => order.status === 'COMPLETED').length,
)

const totalSaved = computed(() =>
  orders.value
    .filter((order) => order.status === 'PAID' || order.status === 'COMPLETED')
    .reduce((total, order) => total + order.totalPrice, 0),
)

const { lastUpdated } = useAutoRefresh(refreshOrders, {
  interval: 15_000,
  enabled: () => !loading.value,
})

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    orders.value = await orderService.listMine()
    lastUpdated.value = new Date()
  } catch (error) {
    orders.value = []
    loadError.value = getErrorMessage(error, 'Riwayat pesanan belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

/** Status pembayaran dan pickup ikut berubah tanpa perlu reload halaman. */
async function refreshOrders(): Promise<void> {
  orders.value = await orderService.listMine()
  loadError.value = ''
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
          Akun customer
        </p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
          Pesanan saya
        </h1>
        <p class="mt-3 max-w-xl text-sm leading-relaxed text-ink-600">
          Tiket aktif, status pembayaran, dan riwayat pickup ada di sini.
        </p>
        <div class="mt-4">
          <LiveBadge :updated-at="lastUpdated" label="Status otomatis" />
        </div>
      </div>

      <RouterLink
        to="/catalog"
        class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
      >
        Cari Surprise Bag
      </RouterLink>
    </header>

    <section
      v-if="!loading && !loadError"
      v-reveal
      class="mt-8 grid grid-cols-3 divide-x divide-ink-900/10 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
    >
      <div class="px-4 py-5 sm:px-6">
        <p class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-500">
          Tiket aktif
        </p>
        <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
          {{ activeOrders.length }}
        </p>
      </div>
      <div class="px-4 py-5 sm:px-6">
        <p class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-500">Selesai</p>
        <p class="mt-2 text-2xl font-extrabold tracking-tight text-brand-700 sm:text-3xl">
          {{ totalCompleted }}
        </p>
      </div>
      <div class="px-4 py-5 sm:px-6">
        <p class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-ink-500">
          Total dibayar
        </p>
        <p class="mt-2 truncate text-xl font-extrabold tracking-tight text-ink-950 sm:text-3xl">
          {{ formatRupiah(totalSaved) }}
        </p>
      </div>
    </section>

    <div v-if="loading" class="mt-8 space-y-3">
      <div v-for="index in 4" :key="index" class="h-32 animate-pulse rounded-[2rem] bg-sage-200" />
    </div>

    <div v-else-if="loadError" class="mt-8">
      <EmptyState title="Pesanan gagal dimuat" :description="loadError">
        <template #icon>⚠️</template>
        <template #action>
          <button
            type="button"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
            @click="load"
          >
            Coba lagi
          </button>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="orders.length === 0" class="mt-8">
      <EmptyState
        title="Belum ada pesanan"
        description="Pesan Surprise Bag pertamamu dan selamatkan makanan layak konsumsi di sekitar Malang."
      >
        <template #icon>🥐</template>
        <template #action>
          <RouterLink
            to="/catalog"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
          >
            Jelajahi katalog
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <section v-if="activeOrders.length > 0" class="mt-10">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            Tiket aktif
          </h2>
          <span class="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-800">
            {{ activeOrders.length }} pesanan
          </span>
        </div>

        <div class="mt-4 space-y-3">
          <article
            v-for="(order, index) in activeOrders"
            :key="order.id"
            v-reveal="{ delay: index * 60 }"
            class="rounded-[2rem] border border-ink-900/10 bg-white p-5 shadow-card transition hover:border-ink-900/25"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex min-w-0 items-start gap-4">
                <img
                  :src="storeImage(order.store.storeName)"
                  :alt="`Ilustrasi ${order.store.storeName}`"
                  loading="lazy"
                  class="hidden h-16 w-16 shrink-0 rounded-2xl object-cover sm:block"
                />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :status="order.status" />
                    <span class="font-mono text-[10px] font-semibold text-ink-500">
                      {{ order.id.slice(0, 8).toUpperCase() }}
                    </span>
                  </div>
                  <h3 class="mt-2 truncate text-base font-extrabold tracking-tight text-ink-950">
                    {{ order.store.storeName }}
                  </h3>
                  <p class="mt-0.5 text-sm text-ink-600">
                    {{ tierLabels[order.tier.name] }} × {{ order.qty }} ·
                    {{ formatRupiah(order.totalPrice) }}
                  </p>
                  <p class="mt-1 text-xs text-ink-500">
                    <template v-if="order.status === 'PENDING' && order.expiresAt">
                      Bayar sebelum {{ formatDate(order.expiresAt) }}
                    </template>
                    <template v-else-if="order.schedule">
                      Pickup {{ formatTimeRange(order.schedule.pickupStart, order.schedule.pickupEnd) }}
                    </template>
                  </p>
                </div>
              </div>

              <RouterLink
                :to="{
                  name: order.status === 'PENDING' ? 'payment' : 'ticket',
                  params: { orderId: order.id },
                }"
                class="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
              >
                {{ order.status === 'PENDING' ? 'Lanjutkan pembayaran' : 'Buka tiket' }}
              </RouterLink>
            </div>
          </article>
        </div>
      </section>

      <section v-if="historyOrders.length > 0" class="mt-10">
        <h2 class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
          Riwayat
        </h2>

        <div
          v-reveal
          class="mt-4 divide-y divide-ink-900/10 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
        >
          <article
            v-for="order in historyOrders"
            :key="order.id"
            class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-extrabold text-ink-950">
                  {{ order.store.storeName }}
                </p>
                <StatusBadge :status="order.status" />
              </div>
              <p class="mt-0.5 text-xs text-ink-500">
                {{ tierLabels[order.tier.name] }} × {{ order.qty }} ·
                {{ formatDate(order.createdAt) }}
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-3">
              <RouterLink
                v-if="order.status === 'COMPLETED' && !order.feedback"
                :to="{ name: 'order-feedback', params: { orderId: order.id } }"
                class="rounded-full bg-brand-100 px-3.5 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-brand-200"
              >
                Beri ulasan
              </RouterLink>
              <span
                v-else-if="order.status === 'COMPLETED' && order.feedback"
                class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                :class="
                  order.feedback.isSatisfied
                    ? 'bg-brand-100 text-brand-800'
                    : 'bg-red-50 text-red-700'
                "
              >
                {{ order.feedback.isSatisfied ? 'Ulasan sesuai' : 'Ulasan tidak sesuai' }}
              </span>
              <p class="text-sm font-extrabold text-ink-950">{{ formatRupiah(order.totalPrice) }}</p>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
