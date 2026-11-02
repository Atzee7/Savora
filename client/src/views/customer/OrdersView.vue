<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatRupiah, formatTimeRange } from '@/utils/format'

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

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    orders.value = await orderService.listMine()
  } catch (error) {
    orders.value = []
    loadError.value = getErrorMessage(error, 'Riwayat pesanan belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          Akun customer / Pesanan
        </p>
        <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">Pesanan saya</h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-stone-500">
          Tiket aktif, status pembayaran, dan riwayat pickup ada di sini.
        </p>
      </div>

      <RouterLink
        to="/catalog"
        class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Cari Surprise Bag
      </RouterLink>
    </header>

    <section v-if="!loading && !loadError" class="mt-6 grid grid-cols-3 divide-x divide-stone-100 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div class="px-4 py-4 sm:px-5">
        <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Tiket aktif</p>
        <p class="mt-2 text-2xl font-extrabold text-stone-900">{{ activeOrders.length }}</p>
      </div>
      <div class="px-4 py-4 sm:px-5">
        <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Selesai</p>
        <p class="mt-2 text-2xl font-extrabold text-emerald-700">{{ totalCompleted }}</p>
      </div>
      <div class="px-4 py-4 sm:px-5">
        <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Total dibayar</p>
        <p class="mt-2 truncate text-xl font-extrabold text-brand-800 sm:text-2xl">{{ formatRupiah(totalSaved) }}</p>
      </div>
    </section>

    <div v-if="loading" class="mt-6 space-y-3">
      <div v-for="index in 4" :key="index" class="h-32 animate-pulse rounded-2xl bg-stone-200" />
    </div>

    <div v-else-if="loadError" class="mt-6">
      <EmptyState title="Pesanan gagal dimuat" :description="loadError">
        <template #icon>⚠️</template>
        <template #action>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            @click="load"
          >
            Coba lagi
          </button>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="orders.length === 0" class="mt-6">
      <EmptyState
        title="Belum ada pesanan"
        description="Pesan Surprise Bag pertamamu dan selamatkan makanan layak konsumsi di sekitar Malang."
      >
        <template #icon>🥐</template>
        <template #action>
          <RouterLink
            to="/catalog"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Jelajahi katalog
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <section v-if="activeOrders.length > 0" class="mt-8">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-sm font-extrabold uppercase tracking-[0.12em] text-stone-400">Tiket aktif</h2>
          <span class="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-800">
            {{ activeOrders.length }} pesanan
          </span>
        </div>

        <div class="mt-3 space-y-3">
          <article
            v-for="order in activeOrders"
            :key="order.id"
            class="card overflow-hidden transition hover:border-brand-200"
          >
            <div class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <StatusBadge :status="order.status" />
                  <span class="font-mono text-[11px] font-semibold text-stone-400">
                    {{ order.id.slice(0, 8).toUpperCase() }}
                  </span>
                </div>
                <h3 class="mt-2 truncate text-base font-extrabold text-stone-900">{{ order.store.storeName }}</h3>
                <p class="mt-0.5 text-sm text-stone-500">
                  {{ tierLabels[order.tier.name] }} × {{ order.qty }} · {{ formatRupiah(order.totalPrice) }}
                </p>
                <p class="mt-1 text-xs text-stone-400">
                  <template v-if="order.status === 'PENDING' && order.expiresAt">
                    Bayar sebelum {{ formatDate(order.expiresAt) }}
                  </template>
                  <template v-else-if="order.schedule">
                    Pickup {{ formatTimeRange(order.schedule.pickupStart, order.schedule.pickupEnd) }}
                  </template>
                </p>
              </div>

              <RouterLink
                :to="{
                  name: order.status === 'PENDING' ? 'payment' : 'ticket',
                  params: { orderId: order.id },
                }"
                class="inline-flex shrink-0 items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                {{ order.status === 'PENDING' ? 'Lanjutkan pembayaran' : 'Buka tiket' }}
              </RouterLink>
            </div>
          </article>
        </div>
      </section>

      <section v-if="historyOrders.length > 0" class="mt-8">
        <h2 class="text-sm font-extrabold uppercase tracking-[0.12em] text-stone-400">Riwayat</h2>

        <div class="mt-3 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <article
            v-for="order in historyOrders"
            :key="order.id"
            class="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate text-sm font-bold text-stone-900">{{ order.store.storeName }}</p>
                <StatusBadge :status="order.status" />
              </div>
              <p class="mt-0.5 text-xs text-stone-500">
                {{ tierLabels[order.tier.name] }} × {{ order.qty }} · {{ formatDate(order.createdAt) }}
              </p>
            </div>
            <div class="flex shrink-0 flex-wrap items-center gap-3">
              <RouterLink
                v-if="order.status === 'COMPLETED' && !order.feedback"
                :to="{ name: 'order-feedback', params: { orderId: order.id } }"
                class="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-brand-100"
              >
                Beri ulasan
              </RouterLink>
              <span
                v-else-if="order.status === 'COMPLETED' && order.feedback"
                class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                :class="
                  order.feedback.isSatisfied
                    ? 'bg-brand-100 text-brand-800'
                    : 'bg-amber-100 text-amber-800'
                "
              >
                {{ order.feedback.isSatisfied ? 'Ulasan sesuai' : 'Ulasan tidak sesuai' }}
              </span>
              <p class="text-sm font-extrabold text-stone-700">{{ formatRupiah(order.totalPrice) }}</p>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
