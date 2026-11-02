<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import { merchantService } from '@/services/merchant.service'
import type { Store, Tier, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTimeRange } from '@/utils/format'

const store = ref<Store | null>(null)
const loading = ref(true)
const loadError = ref('')

const stockDraft = reactive<Record<string, number>>({})
const savingTierId = ref<string | null>(null)
const tierError = ref('')
const tierSuccess = ref('')

const scheduleForm = reactive({ pickupStart: '20:00', pickupEnd: '21:00' })
const savingSchedule = ref(false)
const scheduleError = ref('')
const scheduleSuccess = ref('')

const tierMeta: Record<TierName, { label: string; description: string; emoji: string }> = {
  HEMAT: { label: 'Tier Hemat', description: 'Camilan atau makan ringan.', emoji: '🥯' },
  REGULER: { label: 'Tier Reguler', description: 'Porsi seimbang untuk makan kenyang.', emoji: '🥐' },
  BESAR: { label: 'Tier Besar', description: 'Isi lebih banyak, cocok dibagi.', emoji: '🥖' },
}

const totalDraft = computed(() => {
  if (!store.value) {
    return 0
  }

  return store.value.tiers.reduce((total, tier) => total + (stockDraft[tier.id] ?? 0), 0)
})

function syncForm(loaded: Store): void {
  for (const tier of loaded.tiers) {
    stockDraft[tier.id] = tier.stock
  }

  const schedule = loaded.schedules[0]
  if (schedule) {
    scheduleForm.pickupStart = schedule.pickupStart
    scheduleForm.pickupEnd = schedule.pickupEnd
  }
}

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    const loaded = await merchantService.getStore()
    store.value = loaded
    syncForm(loaded)
  } catch (error) {
    loadError.value = getErrorMessage(error, 'Data toko belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

function changeStock(tier: Tier, delta: number): void {
  const current = stockDraft[tier.id] ?? 0
  const next = Math.min(1000, Math.max(0, current + delta))
  stockDraft[tier.id] = next
}

function isDirty(tier: Tier): boolean {
  return (stockDraft[tier.id] ?? 0) !== tier.stock
}

async function saveStock(tier: Tier): Promise<void> {
  if (savingTierId.value || !store.value) {
    return
  }

  const stock = stockDraft[tier.id]

  if (stock === undefined || stock === tier.stock) {
    return
  }

  savingTierId.value = tier.id
  tierError.value = ''
  tierSuccess.value = ''

  try {
    const updated = await merchantService.updateStock(tier.id, stock)
    const target = store.value.tiers.find((item) => item.id === updated.id)

    if (target) {
      target.stock = updated.stock
    }

    store.value.totalStock = store.value.tiers.reduce((total, item) => total + item.stock, 0)
    tierSuccess.value = `Stok ${tierMeta[tier.name].label} disimpan: ${updated.stock} kantong.`
  } catch (error) {
    tierError.value = getErrorMessage(error, 'Stok belum bisa disimpan.')
  } finally {
    savingTierId.value = null
  }
}

async function saveSchedule(): Promise<void> {
  if (savingSchedule.value) {
    return
  }

  scheduleError.value = ''
  scheduleSuccess.value = ''

  if (scheduleForm.pickupEnd <= scheduleForm.pickupStart) {
    scheduleError.value = 'Jam pickup selesai harus setelah jam mulai.'
    return
  }

  savingSchedule.value = true

  try {
    const updated = await merchantService.updateSchedule(
      scheduleForm.pickupStart,
      scheduleForm.pickupEnd,
    )
    store.value = updated
    syncForm(updated)
    scheduleSuccess.value = 'Jadwal pickup berhasil diperbarui.'
  } catch (error) {
    scheduleError.value = getErrorMessage(error, 'Jadwal pickup belum bisa disimpan.')
  } finally {
    savingSchedule.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div>
    <header>
      <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
        Dasbor mitra / Stok &amp; jadwal
      </p>
      <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
        Kelola stok &amp; jadwal pickup
      </h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
        Stok dan jam pickup menentukan apakah toko tampil di katalog publik. Toko otomatis disembunyikan saat total stok 0 atau jam pickup hari ini sudah lewat.
      </p>
    </header>

    <div v-if="loading" class="mt-6 space-y-4">
      <div class="h-36 animate-pulse rounded-2xl bg-stone-200" />
      <div class="h-72 animate-pulse rounded-2xl bg-stone-200" />
    </div>

    <div v-else-if="loadError || !store" class="mt-6">
      <EmptyState title="Data toko belum bisa dimuat" :description="loadError">
        <template #icon>📦</template>
        <template #action>
          <button
            type="button"
            class="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            @click="load"
          >
            Coba lagi
          </button>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <section class="mt-6 flex flex-col gap-3 rounded-xl border border-stone-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <p class="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400">Ringkasan stok</p>
          <p class="mt-1 text-sm text-stone-600">
            <strong class="text-stone-900">{{ totalDraft }} kantong</strong> tersimpan di draft.
            Tersedia saat ini: <strong class="text-stone-900">{{ store.totalStock }}</strong>.
          </p>
        </div>
        <RouterLink
          to="/merchant"
          class="text-xs font-bold text-brand-700 hover:underline"
        >
          ← Kembali ke dasbor
        </RouterLink>
      </section>

      <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section class="space-y-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-sm font-extrabold uppercase tracking-[0.12em] text-stone-400">Stok per tier</h2>
            <span class="text-xs text-stone-400">Harga tetap sesuai PRD</span>
          </div>

          <div
            v-if="tierError || tierSuccess"
            class="rounded-lg border px-4 py-3 text-sm"
            :class="tierError ? 'border-red-200 bg-red-50 text-red-700' : 'border-brand-200 bg-brand-50 text-brand-900'"
          >
            {{ tierError || tierSuccess }}
          </div>

          <article
            v-for="tier in store.tiers"
            :key="tier.id"
            class="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-start gap-3">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-xl">
                  {{ tierMeta[tier.name].emoji }}
                </span>
                <div>
                  <p class="font-extrabold text-stone-900">{{ tierMeta[tier.name].label }}</p>
                  <p class="mt-0.5 text-xs text-stone-500">{{ tierMeta[tier.name].description }}</p>
                  <p class="mt-1 text-xs font-semibold text-stone-600">
                    {{ formatRupiah(tier.price) }} · senilai min. {{ formatRupiah(tier.minOriginalValue) }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <div class="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white p-1">
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-full text-lg font-bold text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
                    :disabled="(stockDraft[tier.id] ?? 0) <= 0"
                    aria-label="Kurangi stok"
                    @click="changeStock(tier, -1)"
                  >
                    −
                  </button>
                  <input
                    v-model.number="stockDraft[tier.id]"
                    type="number"
                    min="0"
                    max="1000"
                    class="w-14 border-0 bg-transparent text-center font-mono text-sm font-extrabold text-stone-900 outline-none"
                    :aria-label="`Stok ${tierMeta[tier.name].label}`"
                  />
                  <button
                    type="button"
                    class="grid h-8 w-8 place-items-center rounded-full text-lg font-bold text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
                    :disabled="(stockDraft[tier.id] ?? 0) >= 1000"
                    aria-label="Tambah stok"
                    @click="changeStock(tier, 1)"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  class="inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition"
                  :class="
                    isDirty(tier)
                      ? 'bg-brand-700 text-white hover:bg-brand-800'
                      : 'cursor-not-allowed bg-stone-100 text-stone-400'
                  "
                  :disabled="!isDirty(tier) || savingTierId === tier.id"
                  @click="saveStock(tier)"
                >
                  <span
                    v-if="savingTierId === tier.id"
                    class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                    aria-hidden="true"
                  />
                  {{ savingTierId === tier.id ? 'Menyimpan...' : 'Simpan' }}
                </button>
              </div>
            </div>

            <p class="mt-3 text-[11px] text-stone-400">
              Stok tersedia saat ini: <strong class="text-stone-600">{{ tier.stock }}</strong> kantong.
            </p>
          </article>
        </section>

        <aside class="lg:sticky lg:top-24 lg:self-start">
          <section class="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 class="text-sm font-extrabold text-stone-900">Jadwal pickup</h2>
            <p class="mt-1 text-xs leading-relaxed text-stone-500">
              Satu jendela pickup berlaku setiap hari. Customer hanya bisa memesan sebelum jam selesai.
            </p>

            <div class="mt-4 space-y-3">
              <div>
                <label for="pickup-start" class="label">Mulai</label>
                <input id="pickup-start" v-model="scheduleForm.pickupStart" type="time" class="input" />
              </div>
              <div>
                <label for="pickup-end" class="label">Selesai</label>
                <input id="pickup-end" v-model="scheduleForm.pickupEnd" type="time" class="input" />
              </div>
            </div>

            <p v-if="scheduleSuccess" class="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs text-brand-900">
              {{ scheduleSuccess }}
            </p>
            <p v-if="scheduleError" class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {{ scheduleError }}
            </p>

            <button
              type="button"
              class="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="savingSchedule"
              @click="saveSchedule"
            >
              <span
                v-if="savingSchedule"
                class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                aria-hidden="true"
              />
              {{ savingSchedule ? 'Menyimpan...' : 'Simpan jadwal' }}
            </button>

            <div class="mt-4 rounded-lg bg-stone-50 px-3 py-3 text-xs leading-relaxed text-stone-500">
              <p class="font-bold text-stone-700">Jadwal aktif</p>
              <p class="mt-1">
                {{ store.schedules[0] ? formatTimeRange(store.schedules[0].pickupStart, store.schedules[0].pickupEnd) : 'Belum diatur' }}
              </p>
            </div>
          </section>

          <div
            v-if="totalDraft === 0"
            class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800"
          >
            Total stok 0. Toko belum akan muncul di katalog publik sampai ada stok tersimpan.
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
