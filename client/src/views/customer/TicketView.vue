<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import StoreMap from '@/components/store/StoreMap.vue'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { formatCountdown, remainingMs } from '@/utils/countdown'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatRupiah, formatTimeRange } from '@/utils/format'

const props = defineProps<{ orderId: string }>()

const router = useRouter()

const order = ref<Order | null>(null)
const loading = ref(true)
const loadError = ref('')
const now = ref(Date.now())

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Tier Hemat',
  REGULER: 'Tier Reguler',
  BESAR: 'Tier Besar',
}

let timer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null

const countdown = computed(() => remainingMs(order.value?.expiresAt ?? null, now.value))
const pickupPassed = computed(() => countdown.value <= 0)
const isInvalid = computed(() => order.value?.status === 'EXPIRED' || order.value?.status === 'CANCELLED')
const pinDigits = computed(() => (order.value?.pinCode ?? '----').split(''))

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    const loaded = await orderService.getById(props.orderId)

    if (loaded.status === 'PENDING') {
      await router.replace({ name: 'payment', params: { orderId: loaded.id } })
      return
    }

    order.value = loaded
  } catch (error) {
    order.value = null
    loadError.value = getErrorMessage(error, 'Tiket belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

async function refreshSilently(): Promise<void> {
  if (!order.value || order.value.status !== 'PAID') {
    return
  }

  try {
    order.value = await orderService.getById(order.value.id)
  } catch {
    // Biarkan tiket tetap tampil; pengguna bisa memuat ulang manual.
  }
}

watch(countdown, (value) => {
  if (value === 0 && order.value?.status === 'PAID') {
    void load()
  }
})

onMounted(() => {
  void load()
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
  pollTimer = setInterval(() => {
    void refreshSilently()
  }, 15_000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
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
      <div class="h-56 animate-pulse rounded-[2rem] bg-stone-200" />
      <div class="h-72 animate-pulse rounded-3xl bg-stone-200" />
    </div>

    <div v-else-if="loadError || !order" class="mt-6">
      <EmptyState title="Tiket tidak ditemukan" :description="loadError">
        <template #icon>🎟️</template>
        <template #action>
          <RouterLink
            to="/orders"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Lihat semua pesanan
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="isInvalid" class="mt-6">
      <EmptyState
        :title="order.status === 'EXPIRED' ? 'Tiket sudah kedaluwarsa' : 'Pesanan dibatalkan'"
        :description="
          order.status === 'EXPIRED'
            ? 'Waktu pickup sudah lewat sehingga pesanan hangus. Sesuai aturan food rescue, pembayaran tidak dikembalikan.'
            : 'Pesanan ini dibatalkan sebelum dibayar, jadi tidak ada tiket aktif.'
        "
      >
        <template #icon>{{ order.status === 'EXPIRED' ? '⌛' : '✕' }}</template>
        <template #action>
          <RouterLink
            to="/catalog"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Cari Surprise Bag
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <header class="relative mt-6 overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-800 px-6 py-7 text-white sm:px-8">
        <div class="absolute -right-10 -bottom-16 h-56 w-56 rounded-full border-[22px] border-white/10" />
        <div class="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge :status="order.status" />
              <span class="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
                Order {{ order.id.slice(0, 8).toUpperCase() }}
              </span>
            </div>
            <h1 class="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {{ order.status === 'COMPLETED' ? 'Pesanan sudah diambil' : 'Tiket pickup kamu' }}
            </h1>
            <p class="mt-2 max-w-lg text-sm leading-relaxed text-brand-100">
              {{
                order.status === 'COMPLETED'
                  ? 'Terima kasih sudah menyelamatkan makanan. Semoga kantongnya menyenangkan!'
                  : 'Tunjukkan PIN di bawah ke kasir pada jam pickup. Datang sebelum waktu habis.'
              }}
            </p>
          </div>

          <div v-if="order.status === 'PAID'" class="rounded-2xl bg-white/15 px-5 py-4 backdrop-blur">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-100">Batas pickup</p>
            <p class="mt-1 font-mono text-2xl font-extrabold tabular-nums">{{ formatCountdown(countdown) }}</p>
            <p class="mt-0.5 text-[11px] text-brand-100">
              {{ pickupPassed ? 'Waktu pickup berakhir' : 'Hitung mundur WIB' }}
            </p>
          </div>
        </div>
      </header>

      <div class="mt-6 grid gap-5 lg:grid-cols-[1fr_19rem]">
        <section class="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
          <div class="border-b border-dashed border-stone-200 bg-stone-50/60 px-6 py-6 text-center sm:px-8">
            <template v-if="order.status === 'PAID' && order.pinCode">
              <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">PIN pickup</p>
              <div class="mt-3 flex justify-center gap-2 sm:gap-3">
                <span
                  v-for="(digit, index) in pinDigits"
                  :key="index"
                  class="grid h-14 w-12 place-items-center rounded-xl border border-stone-300 bg-white font-mono text-3xl font-extrabold text-stone-900 shadow-sm sm:h-16 sm:w-14 sm:text-4xl"
                >
                  {{ digit }}
                </span>
              </div>
              <p class="mt-3 text-xs text-stone-500">Tunjukkan 4 digit ini ke kasir. Jangan bagikan ke orang lain.</p>
            </template>
            <template v-else>
              <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-2xl">✓</span>
              <p class="mt-3 text-lg font-extrabold text-stone-900">Sudah diverifikasi kasir</p>
              <p class="mt-1 text-sm text-stone-500">PIN sudah dipakai dan tidak aktif lagi.</p>
            </template>
          </div>

          <div class="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
            <div
              v-if="pickupPassed && order.status === 'PAID'"
              class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800 sm:col-span-2"
            >
              Waktu pickup sudah berakhir. Status tiket akan diperbarui otomatis oleh sistem; hubungi toko jika kamu masih di lokasi.
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Toko</p>
              <p class="mt-1.5 font-extrabold text-stone-900">{{ order.store.storeName }}</p>
              <p class="mt-1 text-sm leading-relaxed text-stone-500">{{ order.store.address }}</p>
              <a
                :href="`https://www.google.com/maps/search/?api=1&query=${order.store.latitude},${order.store.longitude}`"
                target="_blank"
                rel="noreferrer"
                class="mt-2 inline-flex text-xs font-bold text-brand-700 hover:underline"
              >
                Buka di Google Maps ↗
              </a>
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Jadwal pickup</p>
              <p v-if="order.schedule" class="mt-1.5 text-lg font-extrabold text-stone-900">
                {{ formatTimeRange(order.schedule.pickupStart, order.schedule.pickupEnd) }}
              </p>
              <p v-else class="mt-1.5 text-sm text-stone-500">Jadwal menyesuaikan toko.</p>
              <p class="mt-1 text-xs text-stone-500">Harap datang dalam jendela waktu ini.</p>
            </div>

            <div class="border-t border-stone-100 pt-4 sm:col-span-2">
              <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span class="text-stone-500">
                  {{ tierLabels[order.tier.name] }} × {{ order.qty }}
                </span>
                <span class="text-lg font-extrabold text-brand-800">{{ formatRupiah(order.totalPrice) }}</span>
              </div>
            </div>
          </div>
        </section>

        <aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div class="overflow-hidden rounded-3xl border border-stone-200 bg-white p-2 shadow-sm">
            <StoreMap :stores="[order.store]" height="13rem" />
          </div>

          <div v-if="order.status === 'COMPLETED'" class="card p-5">
            <template v-if="order.feedback">
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Ulasan kamu</p>
              <div class="mt-3 flex items-center gap-3">
                <span
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                  :class="order.feedback.isSatisfied ? 'bg-brand-100' : 'bg-amber-100'"
                >
                  {{ order.feedback.isSatisfied ? '👍' : '👎' }}
                </span>
                <div>
                  <p class="text-sm font-extrabold text-stone-900">
                    {{ order.feedback.isSatisfied ? 'Sesuai' : 'Tidak sesuai' }}
                  </p>
                  <p class="text-[11px] text-stone-400">{{ formatDate(order.feedback.createdAt) }}</p>
                </div>
              </div>
              <p
                v-if="order.feedback.comment"
                class="mt-3 rounded-xl bg-stone-50 px-3 py-2.5 text-xs leading-relaxed text-stone-600"
              >
                “{{ order.feedback.comment }}”
              </p>
            </template>
            <template v-else>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Ulasan pesanan</p>
              <p class="mt-2 text-sm font-extrabold text-stone-900">Bagaimana isi kantongmu?</p>
              <p class="mt-1 text-xs leading-relaxed text-stone-500">
                Ulasan singkat membantu admin memantau kualitas mitra.
              </p>
              <RouterLink
                :to="{ name: 'order-feedback', params: { orderId: order.id } }"
                class="mt-3 inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Beri ulasan
              </RouterLink>
            </template>
          </div>

          <div class="card p-5">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Pengingat</p>
            <ul class="mt-3 space-y-2.5 text-sm leading-relaxed text-stone-600">
              <li class="flex gap-2.5">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Bawa tas sendiri agar lebih ramah lingkungan.
              </li>
              <li class="flex gap-2.5">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Isi kantong bersifat kejutan sesuai tier yang dipilih.
              </li>
              <li class="flex gap-2.5">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Tiket hangus jika melewati batas pickup, tanpa refund.
              </li>
            </ul>
          </div>

          <RouterLink
            to="/orders"
            class="flex w-full items-center justify-center rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
          >
            Lihat semua pesanan
          </RouterLink>
        </aside>
      </div>
    </template>
  </div>
</template>
