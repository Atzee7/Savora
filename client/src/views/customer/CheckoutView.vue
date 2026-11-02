<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import EmptyState from '@/components/common/EmptyState.vue'
import { orderService } from '@/services/order.service'
import type { CheckoutInfo, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTimeRange } from '@/utils/format'

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
  } catch (error) {
    info.value = null
    loadError.value = getErrorMessage(error, 'Checkout belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

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
    <RouterLink
      v-if="info"
      :to="{ name: 'store-detail', params: { id: info.store.id } }"
      class="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
    >
      <span aria-hidden="true">←</span> Kembali ke {{ info.store.storeName }}
    </RouterLink>
    <RouterLink
      v-else
      to="/catalog"
      class="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
    >
      <span aria-hidden="true">←</span> Kembali ke katalog
    </RouterLink>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-40 animate-pulse rounded-[2rem] bg-stone-200" />
      <div class="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div class="h-72 animate-pulse rounded-3xl bg-stone-200" />
        <div class="h-72 animate-pulse rounded-3xl bg-stone-200" />
      </div>
    </div>

    <div v-else-if="loadError || !info" class="mt-6">
      <EmptyState title="Checkout tidak tersedia" :description="loadError">
        <template #icon>🛍️</template>
        <template #action>
          <RouterLink
            to="/catalog"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Cari Surprise Bag lain
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <header class="relative mt-6 overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 px-6 py-8 text-white sm:px-9">
        <div class="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[22px] border-white/10" />
        <div class="relative">
          <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
            Checkout
          </p>
          <h1 class="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Siapkan Surprise Bag kamu
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-relaxed text-brand-100">
            Stok dikunci selama 15 menit setelah pesanan dibuat. Selesaikan pembayaran sebelum waktu habis.
          </p>
          <div class="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
            <span class="rounded-full bg-white/15 px-3 py-1.5">{{ info.store.storeName }}</span>
            <span class="rounded-full bg-white/15 px-3 py-1.5">
              Pickup {{ formatTimeRange(info.schedule.pickupStart, info.schedule.pickupEnd) }}
            </span>
            <span class="rounded-full bg-white/15 px-3 py-1.5">
              Sisa {{ info.tier.stock }} kantong
            </span>
          </div>
        </div>
      </header>

      <div class="mt-6 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div class="space-y-5">
          <section class="card p-5 sm:p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Paket dipilih</p>
                <h2 class="mt-2 text-xl font-extrabold tracking-tight text-stone-900">
                  {{ tierLabels[info.tier.name] }}
                </h2>
                <p class="mt-1 text-sm text-stone-500">
                  Senilai min. {{ formatRupiah(info.tier.minOriginalValue) }} · isi kejutan
                </p>
              </div>
              <p class="text-right text-2xl font-extrabold tracking-tight text-brand-800">
                {{ formatRupiah(info.tier.price) }}
              </p>
            </div>

            <div class="mt-6 border-t border-stone-100 pt-5">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p class="text-sm font-bold text-stone-900">Jumlah kantong</p>
                  <p class="mt-1 text-xs text-stone-500">
                    Maksimal {{ info.maxQty }} kantong per toko per hari. Sisa kuota kamu:
                    <strong class="text-stone-700">{{ info.remainingQty }}</strong>.
                  </p>
                </div>

                <div class="inline-flex items-center gap-1 self-start rounded-full border border-stone-200 bg-white p-1 sm:self-auto">
                  <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="qty <= 1"
                    aria-label="Kurangi jumlah kantong"
                    @click="changeQty(-1)"
                  >
                    −
                  </button>
                  <span class="w-8 text-center text-base font-extrabold text-stone-900">{{ qty }}</span>
                  <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-stone-600 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-800"
              >
                <template v-if="info.tier.stock === 0">Stok tier ini sudah habis. Pilih tier lain di halaman toko.</template>
                <template v-else>Kuota harian kamu di toko ini sudah penuh. Kembali besok atau pilih toko lain.</template>
              </div>
            </div>
          </section>

          <section class="card p-5 sm:p-6">
            <h2 class="text-sm font-extrabold uppercase tracking-[0.12em] text-stone-400">Setelah menekan pesan</h2>
            <ol class="mt-4 space-y-4">
              <li class="flex gap-3">
                <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-800">1</span>
                <p class="text-sm leading-relaxed text-stone-600">
                  Stok <strong class="text-stone-800">{{ qty }} kantong</strong> langsung dikunci untukmu selama 15 menit.
                </p>
              </li>
              <li class="flex gap-3">
                <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-800">2</span>
                <p class="text-sm leading-relaxed text-stone-600">
                  Bayar lewat simulasi sandbox. Tidak ada uang sungguhan yang dipotong.
                </p>
              </li>
              <li class="flex gap-3">
                <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-800">3</span>
                <p class="text-sm leading-relaxed text-stone-600">
                  PIN 4 digit dan tiket pickup muncul otomatis. Tunjukkan ke kasir saat mengambil pesanan.
                </p>
              </li>
            </ol>
          </section>
        </div>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <section class="card overflow-hidden">
            <div class="border-b border-stone-100 px-5 py-4">
              <h2 class="text-sm font-extrabold text-stone-900">Ringkasan pesanan</h2>
            </div>
            <div class="space-y-3 px-5 py-4 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-stone-500">{{ tierLabels[info.tier.name] }} × {{ qty }}</span>
                <span class="font-semibold text-stone-800">{{ formatRupiah(total) }}</span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-stone-500">Biaya layanan</span>
                <span class="font-semibold text-brand-700">Gratis</span>
              </div>
              <div class="border-t border-dashed border-stone-200 pt-3">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-bold text-stone-900">Total bayar</span>
                  <span class="text-xl font-extrabold tracking-tight text-brand-800">{{ formatRupiah(total) }}</span>
                </div>
              </div>
            </div>

            <div class="space-y-3 border-t border-stone-100 px-5 py-4">
              <div v-if="submitError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700">
                {{ submitError }}
              </div>
              <button
                type="button"
                class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="submitting || maxSelectable === 0"
                @click="submit"
              >
                <span
                  v-if="submitting"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden="true"
                />
                {{ submitting ? 'Membuat pesanan...' : 'Pesan & lanjut bayar' }}
              </button>
              <p class="text-center text-[11px] leading-relaxed text-stone-400">
                Dengan memesan, stok langsung dikurangi dari katalog publik.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
