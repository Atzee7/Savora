<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { merchantService } from '@/services/merchant.service'
import type { PinVerificationResult, Store } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTime, formatTimeRange } from '@/utils/format'

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

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)

  try {
    store.value = await merchantService.getStore()
  } catch {
    store.value = null
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="mx-auto max-w-4xl">
    <header>
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        Dasbor mitra / Verifikasi
      </p>
      <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
        Terminal verifikasi PIN
      </h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
        Minta PIN 4 digit dari customer, lalu masukkan lewat keypad. Pesanan harus berstatus dibayar dan masih dalam jam pickup.
      </p>
      <p v-if="store" class="mt-2 text-xs font-semibold text-stone-500">
        {{ store.storeName }}
        <template v-if="schedule"> · {{ formatTimeRange(schedule.pickupStart, schedule.pickupEnd) }}</template>
      </p>
    </header>

    <div class="mt-6 grid gap-5 lg:grid-cols-[20rem_1fr]">
      <section class="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
        <div class="flex justify-center gap-2">
          <div
            v-for="index in 4"
            :key="index"
            class="grid h-14 w-12 place-items-center rounded-xl border font-mono text-3xl font-extrabold transition"
            :class="
              pin.length >= index
                ? 'border-brand-300 bg-brand-50 text-brand-900'
                : 'border-stone-200 bg-stone-50 text-stone-300'
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
            class="h-14 rounded-xl border border-stone-200 bg-white font-mono text-xl font-bold text-stone-800 transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98] disabled:opacity-50"
            :disabled="verifying"
            @click="appendDigit(digit)"
          >
            {{ digit }}
          </button>
          <button
            type="button"
            class="h-14 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold uppercase tracking-wide text-stone-500 transition hover:bg-stone-100 disabled:opacity-50"
            :disabled="verifying"
            @click="clearPin"
          >
            Hapus
          </button>
          <button
            type="button"
            class="h-14 rounded-xl border border-stone-200 bg-white font-mono text-xl font-bold text-stone-800 transition hover:border-brand-300 hover:bg-brand-50 active:scale-[0.98] disabled:opacity-50"
            :disabled="verifying"
            @click="appendDigit('0')"
          >
            0
          </button>
          <button
            type="button"
            class="h-14 rounded-xl border border-stone-200 bg-stone-50 text-lg font-bold text-stone-500 transition hover:bg-stone-100 disabled:opacity-50"
            :disabled="verifying"
            aria-label="Hapus digit terakhir"
            @click="removeDigit"
          >
            ⌫
          </button>
        </div>

        <button
          type="button"
          class="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!canSubmit"
          @click="verify"
        >
          <span
            v-if="verifying"
            class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
          {{ verifying ? 'Memeriksa PIN...' : 'Verifikasi PIN' }}
        </button>

        <p class="mt-3 text-center text-[11px] leading-relaxed text-stone-400">
          Bisa juga pakai keyboard: angka, Backspace, Enter.
        </p>
      </section>

      <div class="space-y-4">
        <section
          v-if="result"
          class="rounded-3xl border border-emerald-200 bg-emerald-50 p-5"
        >
          <div class="flex items-start gap-3">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-600 text-xl text-white">✓</span>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Pickup berhasil</p>
              <h2 class="mt-1 text-lg font-extrabold text-emerald-950">{{ result.customerName }}</h2>
              <p class="mt-1 text-sm text-emerald-800">
                {{ result.tierName }} × {{ result.qty }} · {{ formatRupiah(result.totalPrice) }}
              </p>
              <p class="mt-1 text-xs text-emerald-700">
                Diverifikasi pukul {{ formatTime(result.completedAt) }} WIB. Status pesanan menjadi COMPLETED.
              </p>
            </div>
          </div>
        </section>

        <section v-else-if="error" class="rounded-3xl border border-red-200 bg-red-50 p-5">
          <div class="flex items-start gap-3">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-100 text-xl text-red-700">!</span>
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-red-600">Verifikasi gagal</p>
              <p class="mt-1 text-sm leading-relaxed text-red-800">{{ error }}</p>
              <p class="mt-2 text-xs leading-relaxed text-red-600">
                Periksa PIN bersama customer. Jika waktu pickup sudah lewat, tiket tidak bisa diverifikasi.
              </p>
            </div>
          </div>
        </section>

        <section v-else class="rounded-3xl border border-stone-200 bg-white p-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Panduan singkat</p>
          <ol class="mt-3 space-y-3">
            <li class="flex gap-3 text-sm leading-relaxed text-stone-600">
              <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-extrabold text-stone-600">1</span>
              Cocokkan pesanan customer dengan kantong yang disiapkan.
            </li>
            <li class="flex gap-3 text-sm leading-relaxed text-stone-600">
              <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-extrabold text-stone-600">2</span>
              Minta customer menunjukkan tiket dan PIN 4 digit.
            </li>
            <li class="flex gap-3 text-sm leading-relaxed text-stone-600">
              <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-extrabold text-stone-600">3</span>
              Masukkan PIN. Sistem hanya menerima tiket PAID yang masih dalam jam pickup.
            </li>
            <li class="flex gap-3 text-sm leading-relaxed text-stone-600">
              <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-extrabold text-stone-600">4</span>
              Setelah berhasil, serahkan kantong dan status pesanan menjadi selesai.
            </li>
          </ol>
        </section>

        <div class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
          PIN hanya bisa dipakai sekali. Jika customer kehilangan tiket, minta mereka membuka halaman Pesanan terlebih dahulu.
        </div>
      </div>
    </div>
  </div>
</template>
