<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { merchantService } from '@/services/merchant.service'
import { useAuthStore } from '@/stores/auth'
import type { MerchantSummary, Store, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTime, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

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

const todayLabel = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
}).format(new Date())

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
      <div class="h-56 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="h-36 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="h-52 animate-pulse rounded-[2rem] bg-sage-200" />
        <div class="h-52 animate-pulse rounded-[2rem] bg-sage-200" />
      </div>
    </div>

    <div v-else-if="loadError || !store || !summary">
      <EmptyState title="Dasbor belum bisa dimuat" :description="loadError">
        <template #icon>🏪</template>
        <template #action>
          <AppButton variant="ink" @click="load">Coba lagi</AppButton>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <PageHero
        :image="storeImage(store.storeName)"
        eyebrow="Dasbor mitra"
        :title="store.storeName"
        :description="store.address"
      >
        <template #badges>
          <StatusBadge :status="store.status" />
          <span
            class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
          >
            {{ summary.bagsToday }} kantong terjual hari ini
          </span>
        </template>

        <template #aside>
          <div class="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-200">
              Pendapatan hari ini
            </p>
            <p class="mt-1 text-3xl font-extrabold tracking-tight text-white">
              {{ formatRupiah(summary.revenueToday) }}
            </p>
            <p class="mt-0.5 text-[11px] font-semibold text-sage-200">
              Dari {{ summary.completedToday }} pesanan selesai
            </p>
          </div>
        </template>

        <template #meta>
          <span class="inline-flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
            {{ todayLabel }}
          </span>
          <span class="text-white/30" aria-hidden="true">·</span>
          <span v-if="schedule">
            Pickup {{ formatTimeRange(schedule.pickupStart, schedule.pickupEnd) }}
          </span>
          <span v-else>Jadwal pickup belum diatur</span>
          <span class="text-white/30" aria-hidden="true">·</span>
          <span>{{ store.totalStock }} kantong tersedia</span>
        </template>
      </PageHero>

      <div class="mt-6 flex items-center justify-between gap-3">
        <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
          Ringkasan hari ini
        </p>
        <AppButton variant="secondary" size="sm" @click="load">Muat ulang data</AppButton>
      </div>

      <section
        class="mt-3 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-ink-900/10 shadow-card"
      >
        <div class="grid grid-cols-2 gap-px lg:grid-cols-4">
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Pendapatan
            </p>
            <p class="mt-2 truncate text-2xl font-extrabold tracking-tight text-brand-700">
              {{ formatRupiah(summary.revenueToday) }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">{{ summary.bagsToday }} kantong terjual</p>
          </div>
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Pesanan selesai
            </p>
            <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
              {{ summary.completedToday }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">Diverifikasi hari ini</p>
          </div>
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Menunggu pickup
            </p>
            <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
              {{ summary.activePickups }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">Tiket aktif</p>
          </div>
          <div class="bg-white px-5 py-5 sm:px-6">
            <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
              Total stok
            </p>
            <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
              {{ summary.totalStock }}
            </p>
            <p class="mt-1 text-[11px] text-ink-500">Semua tier</p>
          </div>
        </div>
      </section>

      <section class="mt-6 grid gap-4 sm:grid-cols-2">
        <RouterLink
          to="/merchant/verify"
          class="group relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-[2rem] bg-ink-950 p-6 text-white shadow-card transition hover:bg-ink-900"
        >
          <div
            class="absolute -right-14 -top-16 h-44 w-44 rounded-full border-[22px] border-white/5"
            aria-hidden="true"
          />
          <div
            class="absolute -bottom-16 -left-10 h-36 w-36 rounded-full border-[18px] border-brand-400/10"
            aria-hidden="true"
          />

          <div class="relative flex h-full flex-col">
            <span class="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-brand-200">
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="M7 9h2M11 9h2M15 9h2M7 13h2M11 13h2M15 13h2M7 17h10" />
              </svg>
            </span>
            <h2 class="mt-5 text-xl font-extrabold tracking-tight">Terminal verifikasi</h2>
            <p class="mt-2 max-w-xs text-sm leading-relaxed text-sage-200">
              Masukkan PIN 4 digit dari customer untuk menyelesaikan pickup malam ini.
            </p>
            <span
              class="mt-auto inline-flex items-center gap-2 pt-5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-300"
            >
              Buka terminal
              <svg
                class="h-3.5 w-3.5 transition group-hover:translate-x-1 motion-reduce:transition-none"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </span>
          </div>
        </RouterLink>

        <RouterLink
          to="/merchant/stock"
          class="group relative flex min-h-[13.5rem] flex-col overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card transition hover:border-ink-900/25"
        >
          <div
            class="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-sage-100"
            aria-hidden="true"
          />

          <div class="relative flex h-full flex-col">
            <span class="grid h-11 w-11 place-items-center rounded-2xl bg-sage-100 text-brand-700">
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z" />
                <path d="M4 8.5 12 13l8-4.5M12 13v7" />
              </svg>
            </span>
            <h2 class="mt-5 text-xl font-extrabold tracking-tight text-ink-950">
              Stok &amp; jadwal pickup
            </h2>
            <p class="mt-2 max-w-xs text-sm leading-relaxed text-ink-600">
              Perbarui jumlah kantong per tier dan jendela pickup harian toko.
            </p>
            <span
              class="mt-auto inline-flex items-center gap-2 pt-5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-700"
            >
              Atur stok
              <svg
                class="h-3.5 w-3.5 transition group-hover:translate-x-1 motion-reduce:transition-none"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M4 10h12M11 5l5 5-5 5" />
              </svg>
            </span>
          </div>
        </RouterLink>
      </section>

      <section
        class="mt-6 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
      >
        <div class="flex items-center justify-between gap-3 border-b border-ink-900/10 px-5 py-5 sm:px-6">
          <div>
            <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
              Pesanan hari ini
            </p>
            <h2 class="mt-1 text-lg font-extrabold tracking-tight text-ink-950">
              10 pesanan terbaru
            </h2>
          </div>
          <span class="rounded-full bg-sage-200 px-2.5 py-1 text-[11px] font-bold text-ink-700">
            {{ summary.recentOrders.length }}
          </span>
        </div>

        <div v-if="summary.recentOrders.length === 0" class="px-6 py-12 text-center">
          <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-2xl">
            🍽️
          </span>
          <p class="mt-4 text-sm font-extrabold text-ink-950">Belum ada pesanan hari ini</p>
          <p class="mt-1 text-xs leading-relaxed text-ink-600">
            Pesanan customer akan muncul di sini setelah checkout.
          </p>
        </div>

        <div v-else class="divide-y divide-ink-900/10">
          <article
            v-for="order in summary.recentOrders"
            :key="order.id"
            class="flex flex-col gap-3 px-5 py-4 transition hover:bg-sage-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sage-100 text-sm font-extrabold text-ink-700"
                aria-hidden="true"
              >
                {{ order.customerName.charAt(0).toUpperCase() }}
              </span>
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="truncate text-sm font-extrabold text-ink-950">
                    {{ order.customerName }}
                  </p>
                  <StatusBadge :status="order.status" />
                </div>
                <p class="mt-0.5 text-xs text-ink-600">
                  {{ tierLabels[order.tierName] }} × {{ order.qty }} ·
                  {{ formatTime(order.createdAt) }} WIB
                  <template v-if="order.status === 'PAID' && order.expiresAt">
                    · pickup sampai {{ formatTime(order.expiresAt) }}
                  </template>
                </p>
              </div>
            </div>
            <p class="shrink-0 text-sm font-extrabold text-ink-900">
              {{ formatRupiah(order.totalPrice) }}
            </p>
          </article>
        </div>
      </section>

      <p class="mt-5 text-xs leading-relaxed text-ink-600">
        Masuk sebagai {{ auth.user?.name }}. Data dihitung dari pesanan toko ini pada hari berjalan
        (WIB).
      </p>
    </template>
  </div>
</template>
