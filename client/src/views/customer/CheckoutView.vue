<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import PageHero from '@/components/common/PageHero.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { orderService } from '@/services/order.service'
import type { CheckoutInfo, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

const props = defineProps<{ tierId: string }>()

const router = useRouter()

const info = ref<CheckoutInfo | null>(null)
const loading = ref(true)
const loadError = ref('')
const qty = ref(1)
const submitting = ref(false)
const submitError = ref('')

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Tier Hemat',
  REGULER: 'Tier Reguler',
  BESAR: 'Tier Besar',
}

const maxSelectable = computed(() => {
  if (!info.value) {
    return 0
  }

  return Math.min(info.value.maxQty, info.value.tier.stock, info.value.remainingQty)
})

const total = computed(() => (info.value ? info.value.tier.price * qty.value : 0))

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    info.value = await orderService.checkoutInfo(props.tierId)
    qty.value = 1
    lastUpdated.value = new Date()
  } catch (error) {
    info.value = null
    loadError.value = getErrorMessage(error, 'Checkout belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

/** Stok dan sisa kuota mengikuti perubahan terbaru tanpa reload. */
async function refreshCheckout(): Promise<void> {
  const loaded = await orderService.checkoutInfo(props.tierId)
  info.value = loaded

  const limit = Math.min(loaded.maxQty, loaded.tier.stock, loaded.remainingQty)

  if (qty.value > limit) {
    qty.value = Math.max(1, limit)
  }
}

const { lastUpdated } = useAutoRefresh(refreshCheckout, {
  interval: 20_000,
  enabled: () => !loading.value && info.value !== null,
})

function changeQty(delta: number): void {
  const next = qty.value + delta

  if (next < 1 || next > maxSelectable.value) {
    return
  }

  qty.value = next
}

async function submit(): Promise<void> {
  if (submitting.value || !info.value || maxSelectable.value === 0) {
    return
  }

  submitError.value = ''
  submitting.value = true

  try {
    const order = await orderService.create({
      tierId: info.value.tier.id,
      qty: qty.value,
    })

    await router.push({ name: 'payment', params: { orderId: order.id } })
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Pesanan belum bisa dibuat.')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <RouterLink
        v-if="info"
        :to="{ name: 'store-detail', params: { id: info.store.id } }"
        class="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
      >
        <span aria-hidden="true">←</span> Kembali ke {{ info.store.storeName }}
      </RouterLink>
      <RouterLink
        v-else
        to="/catalog"
        class="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
      >
        <span aria-hidden="true">←</span> Kembali ke katalog
      </RouterLink>

      <LiveBadge v-if="info" :updated-at="lastUpdated" label="Stok otomatis" />
    </div>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-52 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div class="h-72 animate-pulse rounded-[2rem] bg-sage-200" />
        <div class="h-72 animate-pulse rounded-[2rem] bg-sage-200" />
      </div>
    </div>

    <div v-else-if="loadError || !info" class="mt-6">
      <EmptyState title="Checkout tidak tersedia" :description="loadError">
        <template #icon>🛍️</template>
        <template #action>
          <RouterLink
            to="/catalog"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
          >
            Cari Surprise Bag lain
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-6">
        <PageHero
          :image="storeImage(info.store.storeName)"
          eyebrow="Checkout"
          title="Siapkan Surprise Bag kamu"
          description="Stok dikunci selama 15 menit setelah pesanan dibuat. Selesaikan pembayaran sebelum waktu habis."
        >
          <template #badges>
            <span
              class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
            >
              {{ tierLabels[info.tier.name] }}
            </span>
          </template>

          <template #meta>
            <span>{{ info.store.storeName }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>Pickup {{ formatTimeRange(info.schedule.pickupStart, info.schedule.pickupEnd) }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span class="inline-flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
              Sisa {{ info.tier.stock }} kantong
            </span>
          </template>
        </PageHero>
      </div>

      <div class="mt-6 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div class="space-y-5">
          <section v-reveal class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
                  Paket dipilih
                </p>
                <h2 class="mt-2 text-xl font-extrabold tracking-tight text-ink-950">
                  {{ tierLabels[info.tier.name] }}
                </h2>
                <p class="mt-1 text-sm text-ink-600">
                  Senilai min. {{ formatRupiah(info.tier.minOriginalValue) }} · isi kejutan
                </p>
              </div>
              <p class="text-right text-2xl font-extrabold tracking-tight text-ink-950">
                {{ formatRupiah(info.tier.price) }}
              </p>
            </div>

            <div class="mt-6 border-t border-ink-900/10 pt-5">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm font-bold text-ink-950">Jumlah kantong</p>
                  <p class="mt-1 text-xs leading-relaxed text-ink-500">
                    Maksimal {{ info.maxQty }} kantong per toko per hari. Sisa kuota kamu:
                    <strong class="text-ink-800">{{ info.remainingQty }}</strong>.
                  </p>
                </div>

                <div
                  class="inline-flex items-center gap-1 self-start rounded-full border border-ink-900/15 bg-white p-1 sm:self-auto"
                >
                  <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-ink-700 transition hover:bg-sage-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="qty <= 1"
                    aria-label="Kurangi jumlah kantong"
                    @click="changeQty(-1)"
                  >
                    −
                  </button>
                  <span class="w-8 text-center text-base font-extrabold text-ink-950">{{ qty }}</span>
                  <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-ink-700 transition hover:bg-sage-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="qty >= maxSelectable"
                    aria-label="Tambah jumlah kantong"
                    @click="changeQty(1)"
                  >
                    +
                  </button>
                </div>
              </div>

              <div
                v-if="maxSelectable === 0"
                class="mt-4 rounded-2xl border border-ink-900/15 bg-sage-100 px-4 py-3 text-sm leading-relaxed text-ink-700"
              >
                <template v-if="info.tier.stock === 0">
                  Stok tier ini sudah habis. Pilih tier lain di halaman toko.
                </template>
                <template v-else>
                  Kuota harian kamu di toko ini sudah penuh. Kembali besok atau pilih toko lain.
                </template>
              </div>
            </div>
          </section>

          <section
            v-reveal="{ delay: 60 }"
            class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card sm:p-8"
          >
            <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
              Setelah menekan pesan
            </p>
            <ol class="mt-5 space-y-4">
              <li class="flex gap-3">
                <span
                  class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white"
                >
                  1
                </span>
                <p class="text-sm leading-relaxed text-ink-600">
                  Stok <strong class="text-ink-950">{{ qty }} kantong</strong> langsung dikunci
                  untukmu selama 15 menit.
                </p>
              </li>
              <li class="flex gap-3">
                <span
                  class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white"
                >
                  2
                </span>
                <p class="text-sm leading-relaxed text-ink-600">
                  Bayar lewat simulasi sandbox. Tidak ada uang sungguhan yang dipotong.
                </p>
              </li>
              <li class="flex gap-3">
                <span
                  class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white"
                >
                  3
                </span>
                <p class="text-sm leading-relaxed text-ink-600">
                  PIN 4 digit dan tiket pickup muncul otomatis. Tunjukkan ke kasir saat mengambil
                  pesanan.
                </p>
              </li>
            </ol>
          </section>
        </div>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <section
            v-reveal="{ delay: 40 }"
            class="overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
          >
            <div class="border-b border-ink-900/10 px-5 py-4">
              <h2 class="text-sm font-extrabold tracking-tight text-ink-950">Ringkasan pesanan</h2>
            </div>
            <div class="space-y-3 px-5 py-4 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-ink-500">{{ tierLabels[info.tier.name] }} × {{ qty }}</span>
                <span class="font-semibold text-ink-900">{{ formatRupiah(total) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-ink-500">Biaya layanan</span>
                <span class="font-semibold text-brand-700">Gratis</span>
              </div>
              <div class="border-t border-dashed border-ink-900/15 pt-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-bold text-ink-950">Total bayar</span>
                  <span class="text-xl font-extrabold tracking-tight text-ink-950">
                    {{ formatRupiah(total) }}
                  </span>
                </div>
              </div>
            </div>

            <div class="space-y-3 border-t border-ink-900/10 px-5 py-4">
              <div
                v-if="submitError"
                class="rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700"
                role="alert"
              >
                {{ submitError }}
              </div>
              <AppButton
                type="button"
                variant="ink"
                size="lg"
                class="w-full"
                :loading="submitting"
                :disabled="submitting || maxSelectable === 0"
                @click="submit"
              >
                {{ submitting ? 'Membuat pesanan...' : 'Pesan & lanjut bayar' }}
              </AppButton>
              <p class="text-center text-[11px] leading-relaxed text-ink-500">
                Dengan memesan, stok langsung dikurangi dari katalog publik.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
