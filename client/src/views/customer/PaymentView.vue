<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { formatCountdown, remainingMs } from '@/utils/countdown'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

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
    lastUpdated.value = new Date()
  } catch (error) {
    order.value = null
    loadError.value = getErrorMessage(error, 'Pesanan belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

/** Menangkap pembayaran, pembatalan, atau kedaluwarsa tanpa reload halaman. */
async function refreshSilently(): Promise<void> {
  if (!order.value || order.value.status !== 'PENDING') {
    return
  }

  const loaded = await orderService.getById(order.value.id)

  if (loaded.status === 'PAID' || loaded.status === 'COMPLETED') {
    await router.replace({ name: 'ticket', params: { orderId: loaded.id } })
    return
  }

  order.value = loaded
}

const { lastUpdated } = useAutoRefresh(refreshSilently, {
  interval: 10_000,
  enabled: () => !loading.value && order.value?.status === 'PENDING',
})

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
    void refreshSilently()
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
      class="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
    >
      <span aria-hidden="true">←</span> Kembali ke pesanan
    </RouterLink>

    <div v-if="order?.status === 'PENDING'" class="mt-4">
      <LiveBadge :updated-at="lastUpdated" label="Status otomatis" />
    </div>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-52 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="h-80 animate-pulse rounded-[2rem] bg-sage-200" />
    </div>

    <div v-else-if="loadError || !order" class="mt-6">
      <EmptyState title="Pesanan tidak ditemukan" :description="loadError">
        <template #icon>🧾</template>
        <template #action>
          <RouterLink
            to="/orders"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
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
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              Cari Surprise Bag
            </RouterLink>
            <RouterLink
              to="/orders"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-sage-100"
            >
              Lihat semua pesanan
            </RouterLink>
          </div>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-6">
        <PageHero
          :image="storeImage(order.store.storeName)"
          eyebrow="Pembayaran sandbox"
          title="Selesaikan pembayaran"
          description="Ini pembayaran sandbox. Tidak ada uang sungguhan yang dipotong, tetapi stok tetap dikunci sampai batas waktu."
        >
          <template #badges>
            <StatusBadge :status="order.status" />
            <span
              class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
            >
              Order {{ order.id.slice(0, 8).toUpperCase() }}
            </span>
          </template>

          <template #aside>
            <div class="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-200">
                Sisa waktu bayar
              </p>
              <p class="mt-1 font-mono text-3xl font-extrabold tabular-nums text-white">
                {{ formatCountdown(countdown) }}
              </p>
            </div>
          </template>
        </PageHero>
      </div>

      <div class="mt-6 grid gap-5 lg:grid-cols-[1fr_19rem]">
        <section v-reveal class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
                Metode pembayaran
              </p>
              <h2 class="mt-2 text-lg font-extrabold tracking-tight text-ink-950">QRIS sandbox</h2>
              <p class="mt-1 text-sm text-ink-600">Simulasi pembayaran instan tanpa gateway.</p>
            </div>
            <span class="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-800">
              Aktif
            </span>
          </div>

          <div
            class="mt-5 flex flex-col items-center gap-5 rounded-2xl border border-dashed border-ink-900/15 bg-sage-100/70 px-5 py-7 sm:flex-row sm:items-center sm:justify-between"
          >
            <div
              class="grid grid-cols-7 gap-1 rounded-xl border border-ink-900/10 bg-white p-3 shadow-sm"
              aria-hidden="true"
            >
              <span
                v-for="(cell, index) in qrPattern"
                :key="index"
                class="h-3 w-3 rounded-[2px]"
                :class="cell ? 'bg-ink-900' : 'bg-transparent'"
              />
            </div>
            <div class="text-center sm:text-right">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-600">Total bayar</p>
              <p class="mt-1 text-3xl font-extrabold tracking-tight text-ink-950">
                {{ formatRupiah(order.totalPrice) }}
              </p>
              <p class="mt-1 text-xs text-ink-600">
                {{ order.qty }} kantong · {{ tierLabels[order.tier.name] }}
              </p>
            </div>
          </div>

          <div
            v-if="isExpired"
            class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
            role="alert"
          >
            Waktu pembayaran sudah habis. Status pesanan diperbarui otomatis oleh sistem.
          </div>
          <div
            v-else-if="payError"
            class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
            role="alert"
          >
            {{ payError }}
          </div>

          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
            <AppButton
              type="button"
              variant="ink"
              size="lg"
              class="flex-1"
              :loading="paying"
              :disabled="paying || cancelling || isExpired"
              @click="pay"
            >
              {{ paying ? 'Memproses pembayaran...' : 'Bayar sekarang (sandbox)' }}
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              size="lg"
              :loading="cancelling"
              :disabled="paying || cancelling"
              @click="cancel"
            >
              {{ cancelling ? 'Membatalkan...' : 'Batalkan' }}
            </AppButton>
          </div>
        </section>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <section
            v-reveal="{ delay: 60 }"
            class="overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
          >
            <div class="border-b border-ink-900/10 px-5 py-4">
              <h2 class="text-sm font-extrabold tracking-tight text-ink-950">Detail pesanan</h2>
            </div>
            <div class="space-y-3 px-5 py-4 text-sm">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Toko</p>
                <p class="mt-0.5 font-semibold text-ink-950">{{ order.store.storeName }}</p>
                <p class="mt-0.5 text-xs leading-relaxed text-ink-500">{{ order.store.address }}</p>
              </div>
              <div v-if="order.schedule">
                <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                  Jadwal pickup
                </p>
                <p class="mt-0.5 font-semibold text-ink-950">
                  {{ formatTimeRange(order.schedule.pickupStart, order.schedule.pickupEnd) }}
                </p>
              </div>
              <div class="border-t border-dashed border-ink-900/15 pt-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-ink-500">{{ tierLabels[order.tier.name] }} × {{ order.qty }}</p>
                  <p class="font-semibold text-ink-900">{{ formatRupiah(order.totalPrice) }}</p>
                </div>
                <div class="mt-2 flex items-center justify-between gap-3">
                  <p class="font-bold text-ink-950">Total</p>
                  <p class="text-lg font-extrabold tracking-tight text-ink-950">
                    {{ formatRupiah(order.totalPrice) }}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
