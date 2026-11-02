<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import StoreMap from '@/components/store/StoreMap.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { formatCountdown, remainingMs } from '@/utils/countdown'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatRupiah, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

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
    lastUpdated.value = new Date()
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
    // Biarkan tiket tetap tampil; percobaan berikutnya akan mencoba lagi.
  }
}

const { lastUpdated } = useAutoRefresh(refreshSilently, {
  interval: 15_000,
  enabled: () => !loading.value && order.value?.status === 'PAID',
})

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

    <div v-if="order?.status === 'PAID'" class="mt-4">
      <LiveBadge :updated-at="lastUpdated" label="Status otomatis" />
    </div>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-56 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="h-72 animate-pulse rounded-[2rem] bg-sage-200" />
    </div>

    <div v-else-if="loadError || !order" class="mt-6">
      <EmptyState title="Tiket tidak ditemukan" :description="loadError">
        <template #icon>🎟️</template>
        <template #action>
          <RouterLink
            to="/orders"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
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
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
          >
            Cari Surprise Bag
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-6">
        <PageHero
          :image="storeImage(order.store.storeName)"
          :eyebrow="order.status === 'COMPLETED' ? 'Pesanan selesai' : 'Tiket pickup'"
          :title="order.status === 'COMPLETED' ? 'Pesanan sudah diambil' : 'Tiket pickup kamu'"
          :description="
            order.status === 'COMPLETED'
              ? 'Terima kasih sudah menyelamatkan makanan. Semoga kantongnya menyenangkan!'
              : 'Tunjukkan PIN di bawah ke kasir pada jam pickup. Datang sebelum waktu habis.'
          "
        >
          <template #badges>
            <StatusBadge :status="order.status" />
            <span
              class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
            >
              Order {{ order.id.slice(0, 8).toUpperCase() }}
            </span>
          </template>

          <template v-if="order.status === 'PAID'" #aside>
            <div class="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-200">
                Batas pickup
              </p>
              <p class="mt-1 font-mono text-2xl font-extrabold tabular-nums text-white">
                {{ formatCountdown(countdown) }}
              </p>
              <p class="mt-0.5 text-[11px] text-sage-200">
                {{ pickupPassed ? 'Waktu pickup berakhir' : 'Hitung mundur WIB' }}
              </p>
            </div>
          </template>

          <template #meta>
            <span>{{ order.store.storeName }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>{{ tierLabels[order.tier.name] }} × {{ order.qty }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span v-if="order.schedule">
              Pickup {{ formatTimeRange(order.schedule.pickupStart, order.schedule.pickupEnd) }}
            </span>
          </template>
        </PageHero>
      </div>

      <div class="mt-6 grid gap-5 lg:grid-cols-[1fr_19rem]">
        <section
          v-reveal
          class="overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
        >
          <div class="border-b border-dashed border-ink-900/15 bg-sage-100/70 px-6 py-6 text-center sm:px-8">
            <template v-if="order.status === 'PAID' && order.pinCode">
              <p class="text-[10px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
                PIN pickup
              </p>
              <div class="mt-3 flex justify-center gap-2 sm:gap-3">
                <span
                  v-for="(digit, index) in pinDigits"
                  :key="index"
                  class="grid h-14 w-12 place-items-center rounded-2xl border border-ink-900/15 bg-white font-mono text-3xl font-extrabold text-ink-950 shadow-sm sm:h-16 sm:w-14 sm:text-4xl"
                >
                  {{ digit }}
                </span>
              </div>
              <p class="mt-3 text-xs text-ink-600">
                Tunjukkan 4 digit ini ke kasir. Jangan bagikan ke orang lain.
              </p>
            </template>
            <template v-else>
              <span
                class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-100 text-brand-700"
              >
                <svg
                  class="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 13 4 4 10-10" />
                </svg>
              </span>
              <p class="mt-3 text-lg font-extrabold text-ink-950">Sudah diverifikasi kasir</p>
              <p class="mt-1 text-sm text-ink-600">PIN sudah dipakai dan tidak aktif lagi.</p>
            </template>
          </div>

          <div class="grid gap-5 px-6 py-6 sm:grid-cols-2 sm:px-8">
            <div
              v-if="pickupPassed && order.status === 'PAID'"
              class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700 sm:col-span-2"
              role="alert"
            >
              Waktu pickup sudah berakhir. Status tiket akan diperbarui otomatis oleh sistem;
              hubungi toko jika kamu masih di lokasi.
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Toko</p>
              <p class="mt-1.5 font-extrabold text-ink-950">{{ order.store.storeName }}</p>
              <p class="mt-1 text-sm leading-relaxed text-ink-500">{{ order.store.address }}</p>
              <a
                :href="`https://www.google.com/maps/search/?api=1&query=${order.store.latitude},${order.store.longitude}`"
                target="_blank"
                rel="noreferrer"
                class="mt-2 inline-flex text-xs font-bold text-brand-700 transition hover:text-brand-800"
              >
                Buka di Google Maps ↗
              </a>
            </div>

            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                Jadwal pickup
              </p>
              <p v-if="order.schedule" class="mt-1.5 text-lg font-extrabold text-ink-950">
                {{ formatTimeRange(order.schedule.pickupStart, order.schedule.pickupEnd) }}
              </p>
              <p v-else class="mt-1.5 text-sm text-ink-500">Jadwal menyesuaikan toko.</p>
              <p class="mt-1 text-xs text-ink-500">Harap datang dalam jendela waktu ini.</p>
            </div>

            <div class="border-t border-ink-900/10 pt-4 sm:col-span-2">
              <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span class="text-ink-500">
                  {{ tierLabels[order.tier.name] }} × {{ order.qty }}
                </span>
                <span class="text-lg font-extrabold tracking-tight text-ink-950">
                  {{ formatRupiah(order.totalPrice) }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div class="overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white p-2 shadow-card">
            <StoreMap :stores="[order.store]" height="13rem" />
          </div>

          <div
            v-if="order.status === 'COMPLETED'"
            v-reveal="{ delay: 60 }"
            class="rounded-[2rem] border border-ink-900/10 bg-white p-5 shadow-card"
          >
            <template v-if="order.feedback">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                Ulasan kamu
              </p>
              <div class="mt-3 flex items-center gap-3">
                <span
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
                  :class="order.feedback.isSatisfied ? 'bg-brand-100' : 'bg-red-50'"
                >
                  {{ order.feedback.isSatisfied ? '👍' : '👎' }}
                </span>
                <div>
                  <p class="text-sm font-extrabold text-ink-950">
                    {{ order.feedback.isSatisfied ? 'Sesuai' : 'Tidak sesuai' }}
                  </p>
                  <p class="text-[11px] text-ink-500">{{ formatDate(order.feedback.createdAt) }}</p>
                </div>
              </div>
              <p
                v-if="order.feedback.comment"
                class="mt-3 rounded-2xl bg-sage-100 px-3 py-2.5 text-xs leading-relaxed text-ink-600"
              >
                “{{ order.feedback.comment }}”
              </p>
            </template>
            <template v-else>
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                Ulasan pesanan
              </p>
              <p class="mt-2 text-sm font-extrabold text-ink-950">Bagaimana isi kantongmu?</p>
              <p class="mt-1 text-xs leading-relaxed text-ink-500">
                Ulasan singkat membantu admin memantau kualitas mitra.
              </p>
              <RouterLink
                :to="{ name: 'order-feedback', params: { orderId: order.id } }"
                class="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
              >
                Beri ulasan
              </RouterLink>
            </template>
          </div>

          <div v-reveal="{ delay: 90 }" class="rounded-[2rem] border border-ink-900/10 bg-white p-5 shadow-card">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Pengingat</p>
            <ul class="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-600">
              <li class="flex gap-2.5">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                Bawa tas sendiri agar lebih ramah lingkungan.
              </li>
              <li class="flex gap-2.5">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                Isi kantong bersifat kejutan sesuai tier yang dipilih.
              </li>
              <li class="flex gap-2.5">
                <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                Tiket hangus jika melewati batas pickup, tanpa refund.
              </li>
            </ul>
          </div>

          <RouterLink
            to="/orders"
            class="flex min-h-11 w-full items-center justify-center rounded-full border border-ink-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-sage-100"
          >
            Lihat semua pesanan
          </RouterLink>
        </aside>
      </div>
    </template>
  </div>
</template>
