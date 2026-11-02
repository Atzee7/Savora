<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { formatCountdown, remainingMs } from '@/utils/countdown'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTimeRange } from '@/utils/format'

const props = defineProps<{ orderId: string }>()

const router = useRouter()

const order = ref<Order | null>(null)
const loading = ref(true)
const loadError = ref('')
const paying = ref(false)
const payError = ref('')
const cancelling = ref(false)
const now = ref(Date.now())

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Tier Hemat',
  REGULER: 'Tier Reguler',
  BESAR: 'Tier Besar',
}

const qrPattern = [
  1, 1, 1, 0, 1, 0, 1,
  1, 0, 1, 0, 0, 1, 0,
  1, 1, 1, 0, 1, 0, 1,
  0, 0, 0, 1, 0, 1, 1,
  1, 1, 0, 0, 1, 0, 0,
  1, 0, 1, 1, 0, 1, 0,
  1, 1, 1, 0, 1, 0, 1,
]

let timer: ReturnType<typeof setInterval> | null = null

const countdown = computed(() => remainingMs(order.value?.expiresAt ?? null, now.value))
const isExpired = computed(() => countdown.value <= 0)
const isClosed = computed(() => order.value?.status === 'EXPIRED' || order.value?.status === 'CANCELLED')

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    const loaded = await orderService.getById(props.orderId)

    if (loaded.status === 'PAID' || loaded.status === 'COMPLETED') {
      await router.replace({ name: 'ticket', params: { orderId: loaded.id } })
      return
    }

    order.value = loaded
  } catch (error) {
    order.value = null
    loadError.value = getErrorMessage(error, 'Pesanan belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

async function pay(): Promise<void> {
  if (paying.value || !order.value || isExpired.value) {
    return
  }

  paying.value = true
  payError.value = ''

  try {
    await orderService.pay(order.value.id)
    await router.push({ name: 'ticket', params: { orderId: order.value.id } })
  } catch (error) {
    payError.value = getErrorMessage(error, 'Pembayaran sandbox gagal diproses.')
    await load()
  } finally {
    paying.value = false
  }
}

async function cancel(): Promise<void> {
  if (cancelling.value || !order.value) {
    return
  }

  const confirmed = window.confirm('Batalkan pesanan ini? Stok akan dikembalikan ke toko.')
  if (!confirmed) {
    return
  }

  cancelling.value = true
  payError.value = ''

  try {
    await orderService.cancel(order.value.id)
    await router.push({ name: 'orders' })
  } catch (error) {
    payError.value = getErrorMessage(error, 'Pesanan belum bisa dibatalkan.')
    await load()
  } finally {
    cancelling.value = false
  }
}

watch(countdown, (value) => {
  if (value === 0 && order.value?.status === 'PENDING') {
    void load()
  }
})

onMounted(() => {
  void load()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <RouterLink
      to="/orders"
      class="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
    >
      <span aria-hidden="true">←</span> Kembali ke pesanan
    </RouterLink>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-44 animate-pulse rounded-[2rem] bg-stone-200" />
      <div class="h-80 animate-pulse rounded-3xl bg-stone-200" />
    </div>

    <div v-else-if="loadError || !order" class="mt-6">
      <EmptyState title="Pesanan tidak ditemukan" :description="loadError">
        <template #icon>🧾</template>
        <template #action>
          <RouterLink
            to="/orders"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Lihat pesanan saya
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="isClosed" class="mt-6">
      <EmptyState
        :title="order.status === 'EXPIRED' ? 'Waktu pembayaran habis' : 'Pesanan dibatalkan'"
        :description="
          order.status === 'EXPIRED'
            ? 'Stok sudah dikembalikan ke toko. Kamu bisa memesan ulang selama stok dan jam pickup masih tersedia.'
            : 'Stok sudah dikembalikan ke toko. Kamu bisa membuat pesanan baru dari katalog.'
        "
      >
        <template #icon>{{ order.status === 'EXPIRED' ? '⏱️' : '✕' }}</template>
        <template #action>
          <div class="flex flex-col gap-2 sm:flex-row">
            <RouterLink
              to="/catalog"
              class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Cari Surprise Bag
            </RouterLink>
            <RouterLink
              to="/orders"
              class="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
            >
              Lihat semua pesanan
            </RouterLink>
          </div>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <header class="relative mt-6 overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 px-6 py-7 text-white sm:px-8">
        <div class="absolute -right-10 -top-14 h-52 w-52 rounded-full border-[20px] border-white/10" />
        <div class="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge :status="order.status" />
              <span class="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                Order {{ order.id.slice(0, 8).toUpperCase() }}
              </span>
            </div>
            <h1 class="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">Selesaikan pembayaran</h1>
            <p class="mt-2 max-w-lg text-sm leading-relaxed text-amber-50">
              Ini pembayaran sandbox. Tidak ada uang sungguhan yang dipotong, tetapi stok tetap dikunci sampai batas waktu.
            </p>
          </div>

          <div class="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100">Sisa waktu bayar</p>
            <p class="mt-1 font-mono text-3xl font-extrabold tabular-nums">{{ formatCountdown(countdown) }}</p>
          </div>
        </div>
      </header>

      <div class="mt-6 grid gap-5 lg:grid-cols-[1fr_19rem]">
        <section class="card p-5 sm:p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Metode pembayaran</p>
              <h2 class="mt-2 text-lg font-extrabold text-stone-900">QRIS sandbox</h2>
              <p class="mt-1 text-sm text-stone-500">Simulasi pembayaran instan tanpa gateway.</p>
            </div>
            <span class="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-800">Aktif</span>
          </div>

          <div class="mt-5 flex flex-col items-center gap-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 px-5 py-7 sm:flex-row sm:items-center sm:justify-between">
            <div class="grid grid-cols-7 gap-1 rounded-xl bg-white p-3 shadow-sm" aria-hidden="true">
              <span
                v-for="(cell, index) in qrPattern"
                :key="index"
                class="h-3 w-3 rounded-[2px]"
                :class="cell ? 'bg-stone-900' : 'bg-transparent'"
              />
            </div>
            <div class="text-center sm:text-right">
              <p class="text-xs font-semibold uppercase tracking-wide text-stone-400">Total bayar</p>
              <p class="mt-1 text-3xl font-extrabold tracking-tight text-brand-800">{{ formatRupiah(order.totalPrice) }}</p>
              <p class="mt-1 text-xs text-stone-500">{{ order.qty }} kantong · {{ tierLabels[order.tier.name] }}</p>
            </div>
          </div>

          <div v-if="isExpired" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
            Waktu pembayaran sudah habis. Muat ulang halaman untuk melihat status terbaru.
          </div>
          <div v-else-if="payError" class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
            {{ payError }}
          </div>

          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              class="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="paying || cancelling || isExpired"
              @click="pay"
            >
              <span
                v-if="paying"
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              {{ paying ? 'Memproses pembayaran...' : 'Bayar sekarang (sandbox)' }}
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-600 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="paying || cancelling"
              @click="cancel"
            >
              {{ cancelling ? 'Membatalkan...' : 'Batalkan' }}
            </button>
          </div>
        </section>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <section class="card overflow-hidden">
            <div class="border-b border-stone-100 px-5 py-4">
              <h2 class="text-sm font-extrabold text-stone-900">Detail pesanan</h2>
            </div>
            <dl class="space-y-3 px-5 py-4 text-sm">
              <div>
                <dt class="text-[10px] font-bold uppercase tracking-wide text-stone-400">Toko</dt>
                <dd class="mt-0.5 font-semibold text-stone-800">{{ order.store.storeName }}</dd>
                <dd class="mt-0.5 text-xs leading-relaxed text-stone-500">{{ order.store.address }}</dd>
              </div>
              <div v-if="order.schedule">
                <dt class="text-[10px] font-bold uppercase tracking-wide text-stone-400">Jadwal pickup</dt>
                <dd class="mt-0.5 font-semibold text-stone-800">
                  {{ formatTimeRange(order.schedule.pickupStart, order.schedule.pickupEnd) }}
                </dd>
              </div>
              <div class="border-t border-dashed border-stone-200 pt-3">
                <div class="flex items-center justify-between gap-3">
                  <dt class="text-stone-500">{{ tierLabels[order.tier.name] }} × {{ order.qty }}</dt>
                  <dd class="font-semibold text-stone-800">{{ formatRupiah(order.totalPrice) }}</dd>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <dt class="font-bold text-stone-900">Total</dt>
                  <dd class="text-lg font-extrabold text-brand-800">{{ formatRupiah(order.totalPrice) }}</dd>
                </div>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
