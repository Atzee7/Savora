<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import PageHero from '@/components/common/PageHero.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { merchantService } from '@/services/merchant.service'
import type { PinVerificationResult, Store } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTime, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

const store = ref<Store | null>(null)
const pin = ref('')
const verifying = ref(false)
const error = ref('')
const result = ref<PinVerificationResult | null>(null)

const canSubmit = computed(() => pin.value.length === 4 && !verifying.value)
const schedule = computed(() => store.value?.schedules[0] ?? null)

function resetFeedback(): void {
  error.value = ''
  result.value = null
}

function appendDigit(digit: string): void {
  if (verifying.value || pin.value.length >= 4) {
    return
  }

  resetFeedback()
  pin.value += digit
}

function removeDigit(): void {
  if (verifying.value || pin.value.length === 0) {
    return
  }

  resetFeedback()
  pin.value = pin.value.slice(0, -1)
}

function clearPin(): void {
  if (verifying.value) {
    return
  }

  pin.value = ''
  resetFeedback()
}

async function verify(): Promise<void> {
  if (!canSubmit.value) {
    return
  }

  verifying.value = true
  error.value = ''
  result.value = null

  try {
    result.value = await merchantService.verifyPin(pin.value)
    pin.value = ''
  } catch (verifyError) {
    error.value = getErrorMessage(verifyError, 'PIN belum bisa diverifikasi.')
  } finally {
    verifying.value = false
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (/^\d$/.test(event.key)) {
    event.preventDefault()
    appendDigit(event.key)
    return
  }

  if (event.key === 'Backspace') {
    event.preventDefault()
    removeDigit()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    void verify()
    return
  }

  if (event.key === 'Escape') {
    clearPin()
  }
}

async function loadStore(): Promise<void> {
  store.value = await merchantService.getStore()
}

/** Jadwal pickup bisa diubah dari tab lain; terminal ikut menyesuaikan. */
const { lastUpdated } = useAutoRefresh(loadStore, {
  interval: 30_000,
  enabled: () => !verifying.value,
})

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  try {
    await loadStore()
  } catch {
    store.value = null
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div>
    <RouterLink
      to="/merchant"
      class="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
    >
      <span aria-hidden="true">←</span> Kembali ke dasbor
    </RouterLink>

    <div class="mt-6">
      <PageHero
        :image="storeImage(store?.storeName ?? 'Savora')"
        eyebrow="Terminal mitra"
        title="Verifikasi PIN pickup"
        description="Minta PIN 4 digit dari customer, lalu masukkan lewat keypad. Pesanan harus berstatus dibayar dan masih dalam jam pickup."
      >
        <template #badges>
          <span
            class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
          >
            {{ store?.storeName ?? 'Toko mitra' }}
          </span>
          <span
            class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
          >
            PIN 4 digit
          </span>
        </template>

        <template v-if="schedule" #aside>
          <div class="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
            <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-200">
              Jendela pickup
            </p>
            <p class="mt-1 text-lg font-extrabold text-white">
              {{ formatTimeRange(schedule.pickupStart, schedule.pickupEnd) }}
            </p>
            <p class="mt-0.5 text-[11px] font-semibold text-sage-200">Waktu lokal WIB</p>
          </div>
        </template>

        <template #meta>
          <span class="inline-flex items-center gap-2">
            <span class="h-1.5 w-1.5 rounded-full bg-brand-300" aria-hidden="true" />
            Keypad fisik &amp; keyboard didukung
          </span>
          <span class="text-white/30" aria-hidden="true">·</span>
          <span>PIN hanya bisa dipakai sekali</span>
          <span class="text-white/30" aria-hidden="true">·</span>
          <LiveBadge :updated-at="lastUpdated" label="Jadwal otomatis" tone="dark" />
        </template>
      </PageHero>
    </div>

    <div class="mt-6 grid gap-5 lg:grid-cols-[22rem_1fr]">
      <section class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card">
        <div class="flex items-center justify-between gap-3">
          <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
            PIN customer
          </p>
          <span class="text-[11px] font-semibold tabular-nums text-ink-600">
            {{ pin.length }}/4
          </span>
        </div>

        <div class="mt-4 grid grid-cols-4 gap-2" aria-hidden="true">
          <div
            v-for="index in 4"
            :key="index"
            class="grid h-16 place-items-center rounded-2xl border-2 font-mono text-3xl font-extrabold transition"
            :class="
              pin.length >= index
                ? 'border-brand-700 bg-brand-50 text-brand-900'
                : 'border-ink-900/10 bg-sage-50 text-ink-300'
            "
          >
            {{ pin[index - 1] ?? '·' }}
          </div>
        </div>

        <div class="mt-5 grid grid-cols-3 gap-2">
          <button
            v-for="digit in digits"
            :key="digit"
            type="button"
            class="h-14 rounded-2xl border border-ink-900/10 bg-white font-mono text-xl font-bold text-ink-900 transition hover:border-ink-900/30 hover:bg-sage-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="verifying"
            @click="appendDigit(digit)"
          >
            {{ digit }}
          </button>
          <button
            type="button"
            class="h-14 rounded-2xl border border-ink-900/10 bg-sage-100 text-xs font-bold uppercase tracking-[0.12em] text-ink-600 transition hover:bg-sage-200 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="verifying"
            @click="clearPin"
          >
            Hapus
          </button>
          <button
            type="button"
            class="h-14 rounded-2xl border border-ink-900/10 bg-white font-mono text-xl font-bold text-ink-900 transition hover:border-ink-900/30 hover:bg-sage-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="verifying"
            @click="appendDigit('0')"
          >
            0
          </button>
          <button
            type="button"
            class="h-14 rounded-2xl border border-ink-900/10 bg-sage-100 text-lg font-bold text-ink-600 transition hover:bg-sage-200 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="verifying"
            aria-label="Hapus digit terakhir"
            @click="removeDigit"
          >
            ⌫
          </button>
        </div>

        <AppButton
          variant="ink"
          size="lg"
          class="mt-4 w-full"
          :loading="verifying"
          :disabled="!canSubmit"
          @click="verify"
        >
          {{ verifying ? 'Memeriksa PIN...' : 'Verifikasi PIN' }}
        </AppButton>

        <p class="mt-3 text-center text-[11px] leading-relaxed text-ink-500">
          Bisa juga pakai keyboard: angka, Backspace, Enter.
        </p>
      </section>

      <div class="space-y-4">
        <section
          v-if="result"
          class="rounded-[2rem] border border-brand-200 bg-brand-50 p-6"
          role="status"
        >
          <div class="flex items-start gap-4">
            <span
              class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white"
            >
              <svg
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m5 13 4 4 10-10" />
              </svg>
            </span>
            <div class="min-w-0">
              <p class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand-700">
                Pickup berhasil
              </p>
              <h2 class="mt-1 text-xl font-extrabold tracking-tight text-brand-950">
                {{ result.customerName }}
              </h2>
              <p class="mt-1 text-sm font-semibold text-brand-800">
                {{ result.tierName }} × {{ result.qty }} · {{ formatRupiah(result.totalPrice) }}
              </p>
              <p class="mt-1 text-xs leading-relaxed text-brand-700">
                Diverifikasi pukul {{ formatTime(result.completedAt) }} WIB. Status pesanan menjadi
                selesai.
              </p>
              <AppButton variant="secondary" size="sm" class="mt-4" @click="clearPin">
                Verifikasi PIN berikutnya
              </AppButton>
            </div>
          </div>
        </section>

        <section v-else-if="error" class="rounded-[2rem] border border-red-200 bg-red-50 p-6" role="alert">
          <div class="flex items-start gap-4">
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-red-100 text-red-700">
              <svg
                class="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.9"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M12 8v5M12 17h.01" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </span>
            <div>
              <p class="text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-600">
                Verifikasi gagal
              </p>
              <p class="mt-1 text-sm leading-relaxed text-red-800">{{ error }}</p>
              <p class="mt-2 text-xs leading-relaxed text-red-700">
                Periksa PIN bersama customer. Jika waktu pickup sudah lewat, tiket tidak bisa
                diverifikasi.
              </p>
            </div>
          </div>
        </section>

        <section v-else class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card">
          <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
            Panduan singkat
          </p>
          <h2 class="mt-2 text-lg font-extrabold tracking-tight text-ink-950">
            Empat langkah, selesai.
          </h2>
          <ol class="mt-5 space-y-3.5">
            <li class="flex gap-3 text-sm leading-relaxed text-ink-600">
              <span
                class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white"
              >
                1
              </span>
              Cocokkan pesanan customer dengan kantong yang disiapkan.
            </li>
            <li class="flex gap-3 text-sm leading-relaxed text-ink-600">
              <span
                class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white"
              >
                2
              </span>
              Minta customer menunjukkan tiket dan PIN 4 digit.
            </li>
            <li class="flex gap-3 text-sm leading-relaxed text-ink-600">
              <span
                class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white"
              >
                3
              </span>
              Masukkan PIN. Sistem hanya menerima tiket aktif yang masih dalam jam pickup.
            </li>
            <li class="flex gap-3 text-sm leading-relaxed text-ink-600">
              <span
                class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900 text-[11px] font-extrabold text-white"
              >
                4
              </span>
              Setelah berhasil, serahkan kantong dan status pesanan menjadi selesai.
            </li>
          </ol>
        </section>

        <div
          class="rounded-[2rem] border border-ink-900/10 bg-sage-200/70 p-5 text-xs leading-relaxed text-ink-700"
        >
          <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-800">
            Pengingat
          </p>
          <p class="mt-2">
            PIN hanya bisa dipakai sekali. Jika customer kehilangan tiket, minta mereka membuka
            halaman Pesanan terlebih dahulu.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
