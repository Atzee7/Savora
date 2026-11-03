<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { merchantService } from '@/services/merchant.service'
import type { Store, Tier, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatRupiah, formatTimeRange } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

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

const tierMeta: Record<TierName, { label: string; description: string; image: string }> = {
  HEMAT: {
    label: 'Tier Hemat',
    description: 'Camilan atau makan ringan untuk satu orang.',
    image: '/images/store-bakery.webp',
  },
  REGULER: {
    label: 'Tier Reguler',
    description: 'Porsi seimbang untuk makan kenyang.',
    image: '/images/tier-reguler.webp',
  },
  BESAR: {
    label: 'Tier Besar',
    description: 'Isi lebih banyak, cocok dibagi atau disimpan.',
    image: '/images/tier-besar.webp',
  },
}

const schedule = computed(() => store.value?.schedules[0] ?? null)

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

  const currentSchedule = loaded.schedules[0]
  if (currentSchedule) {
    scheduleForm.pickupStart = currentSchedule.pickupStart
    scheduleForm.pickupEnd = currentSchedule.pickupEnd
  }
}

async function load(options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true

  if (!silent) {
    loading.value = true
    loadError.value = ''
  }

  try {
    const loaded = await merchantService.getStore()

    if (silent) {
      applySilentUpdate(loaded)
    } else {
      store.value = loaded
      syncForm(loaded)
    }

    loadError.value = ''
  } catch (error) {
    if (silent) {
      throw error
    }

    loadError.value = getErrorMessage(error, 'Data toko belum bisa dimuat.')
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

/**
 * Perbarui data dari server tanpa menimpa draft yang belum disimpan.
 * Draft yang sudah sama dengan nilai lama ikut mengikuti nilai terbaru.
 */
function applySilentUpdate(loaded: Store): void {
  const previous = store.value
  store.value = loaded

  const loadedIds = new Set(loaded.tiers.map((tier) => tier.id))

  for (const tier of loaded.tiers) {
    const previousStock = previous?.tiers.find((item) => item.id === tier.id)?.stock
    const draft = stockDraft[tier.id]

    if (draft === undefined || draft === previousStock) {
      stockDraft[tier.id] = tier.stock
    }
  }

  for (const tierId of Object.keys(stockDraft)) {
    if (!loadedIds.has(tierId)) {
      delete stockDraft[tierId]
    }
  }

  const previousSchedule = previous?.schedules[0]
  const nextSchedule = loaded.schedules[0]
  const scheduleUntouched =
    !previousSchedule ||
    (scheduleForm.pickupStart === previousSchedule.pickupStart &&
      scheduleForm.pickupEnd === previousSchedule.pickupEnd)

  if (nextSchedule && scheduleUntouched) {
    scheduleForm.pickupStart = nextSchedule.pickupStart
    scheduleForm.pickupEnd = nextSchedule.pickupEnd
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

const hasPendingStock = computed(() => store.value?.tiers.some((tier) => isDirty(tier)) ?? false)

const hasPendingSchedule = computed(() => {
  const current = schedule.value

  if (!current) {
    return false
  }

  return (
    scheduleForm.pickupStart !== current.pickupStart ||
    scheduleForm.pickupEnd !== current.pickupEnd
  )
})

const hasPendingChanges = computed(() => hasPendingStock.value || hasPendingSchedule.value)

const refreshLabel = computed(() =>
  hasPendingChanges.value ? 'Dijeda — ada draft' : 'Otomatis',
)

const { lastUpdated } = useAutoRefresh(() => load({ silent: true }), {
  interval: 20_000,
  enabled: () =>
    !loading.value &&
    !hasPendingChanges.value &&
    savingTierId.value === null &&
    !savingSchedule.value,
})

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
    <RouterLink
      to="/merchant"
      class="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
    >
      <span aria-hidden="true">←</span> Kembali ke dasbor
    </RouterLink>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-56 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div class="h-80 animate-pulse rounded-[2rem] bg-sage-200" />
        <div class="h-80 animate-pulse rounded-[2rem] bg-sage-200" />
      </div>
    </div>

    <div v-else-if="loadError || !store" class="mt-6">
      <EmptyState title="Data toko belum bisa dimuat" :description="loadError">
        <template #icon>📦</template>
        <template #action>
          <AppButton variant="ink" @click="load()">Coba lagi</AppButton>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-6">
        <PageHero
          :image="storeImage(store.storeName)"
          eyebrow="Mitra / Inventori"
          title="Kelola stok & jadwal"
          description="Stok dan jam pickup menentukan apakah toko tampil di katalog publik. Toko otomatis disembunyikan saat total stok 0 atau jam pickup hari ini sudah lewat."
        >
          <template #badges>
            <StatusBadge :status="store.status" />
            <span
              class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
            >
              Draft {{ totalDraft }} kantong
            </span>
          </template>

          <template #aside>
            <div class="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 backdrop-blur">
              <p class="text-[10px] font-bold uppercase tracking-[0.18em] text-sage-200">
                Jendela pickup
              </p>
              <p class="mt-1 text-lg font-extrabold text-white">
                {{
                  schedule
                    ? formatTimeRange(schedule.pickupStart, schedule.pickupEnd)
                    : 'Belum diatur'
                }}
              </p>
              <p class="mt-0.5 text-[11px] font-semibold text-sage-200">
                {{ store.totalStock }} kantong tersedia
              </p>
            </div>
          </template>

          <template #meta>
            <span>{{ store.storeName }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>Harga tetap sesuai PRD</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>Perubahan langsung tampil di katalog</span>
          </template>
        </PageHero>
      </div>

      <div class="mt-6 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section class="space-y-4">
          <div class="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
                Stok per tier
              </p>
              <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
                Tiga kantong, tiga ukuran.
              </h2>
            </div>
            <div class="flex flex-col items-start gap-2 sm:items-end">
              <LiveBadge :updated-at="lastUpdated" :label="refreshLabel" />
              <p class="text-xs text-ink-600">Draft {{ totalDraft }} kantong</p>
            </div>
          </div>

          <div
            v-if="tierError || tierSuccess"
            class="rounded-2xl border px-4 py-3 text-sm leading-relaxed"
            :class="
              tierError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-brand-200 bg-brand-50 text-brand-800'
            "
            role="status"
          >
            {{ tierError || tierSuccess }}
          </div>

          <article
            v-for="tier in store.tiers"
            :key="tier.id"
            class="overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
          >
            <div
              class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"
            >
              <div class="flex min-w-0 items-start gap-4">
                <img
                  :src="tierMeta[tier.name].image"
                  :alt="`Ilustrasi ${tierMeta[tier.name].label}`"
                  loading="lazy"
                  class="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="text-base font-extrabold tracking-tight text-ink-950">
                      {{ tierMeta[tier.name].label }}
                    </h3>
                    <span
                      class="rounded-full px-2.5 py-1 text-[10px] font-bold"
                      :class="
                        tier.stock > 0
                          ? 'bg-brand-100 text-brand-800'
                          : 'bg-red-50 text-red-700'
                      "
                    >
                      {{ tier.stock > 0 ? `${tier.stock} tersedia` : 'Stok habis' }}
                    </span>
                  </div>
                  <p class="mt-1 text-sm leading-relaxed text-ink-600">
                    {{ tierMeta[tier.name].description }}
                  </p>
                  <p class="mt-1 text-xs font-semibold text-ink-500">
                    {{ formatRupiah(tier.price) }} · senilai min.
                    {{ formatRupiah(tier.minOriginalValue) }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <div
                  class="inline-flex items-center gap-1 rounded-full border border-ink-900/15 bg-white p-1"
                >
                  <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-ink-700 transition hover:bg-sage-100 disabled:cursor-not-allowed disabled:opacity-40"
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
                    class="w-14 border-0 bg-transparent text-center font-mono text-sm font-extrabold text-ink-950 outline-none"
                    :aria-label="`Stok ${tierMeta[tier.name].label}`"
                  />
                  <button
                    type="button"
                    class="grid h-9 w-9 place-items-center rounded-full text-lg font-bold text-ink-700 transition hover:bg-sage-100 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="(stockDraft[tier.id] ?? 0) >= 1000"
                    aria-label="Tambah stok"
                    @click="changeStock(tier, 1)"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  class="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition"
                  :class="
                    isDirty(tier)
                      ? 'bg-ink-900 text-white hover:bg-ink-800'
                      : 'cursor-not-allowed bg-sage-200 text-ink-500'
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

            <div
              class="flex flex-wrap items-center justify-between gap-2 border-t border-ink-900/10 bg-sage-50 px-5 py-3 sm:px-6"
            >
              <p class="text-[11px] text-ink-600">
                Stok tersimpan:
                <strong class="text-ink-900">{{ tier.stock }}</strong> kantong.
              </p>
              <p v-if="isDirty(tier)" class="text-[11px] font-bold text-brand-700">
                Ada perubahan belum disimpan
              </p>
            </div>
          </article>
        </section>

        <aside class="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <section class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
              Jam operasional
            </p>
            <h2 class="mt-2 text-lg font-extrabold tracking-tight text-ink-950">Jadwal pickup</h2>
            <p class="mt-1 text-xs leading-relaxed text-ink-600">
              Satu jendela pickup berlaku setiap hari. Customer hanya bisa memesan sebelum jam
              selesai.
            </p>

            <div class="mt-5 space-y-3">
              <div>
                <label for="pickup-start" class="label">Mulai</label>
                <input id="pickup-start" v-model="scheduleForm.pickupStart" type="time" class="input" />
              </div>
              <div>
                <label for="pickup-end" class="label">Selesai</label>
                <input id="pickup-end" v-model="scheduleForm.pickupEnd" type="time" class="input" />
              </div>
            </div>

            <p
              v-if="scheduleSuccess"
              class="mt-3 rounded-2xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-800"
              role="status"
            >
              {{ scheduleSuccess }}
            </p>
            <p
              v-if="scheduleError"
              class="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700"
              role="alert"
            >
              {{ scheduleError }}
            </p>

            <AppButton
              variant="ink"
              size="md"
              class="mt-4 w-full"
              :loading="savingSchedule"
              :disabled="savingSchedule"
              @click="saveSchedule"
            >
              {{ savingSchedule ? 'Menyimpan...' : 'Simpan jadwal' }}
            </AppButton>

            <div class="mt-4 rounded-2xl bg-sage-100 px-4 py-3">
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-600">
                Jadwal aktif
              </p>
              <p class="mt-1 text-sm font-extrabold text-ink-950">
                {{
                  schedule
                    ? formatTimeRange(schedule.pickupStart, schedule.pickupEnd)
                    : 'Belum diatur'
                }}
              </p>
            </div>
          </section>

          <div
            v-if="totalDraft === 0"
            class="rounded-[2rem] border border-red-200 bg-red-50 p-5 text-xs leading-relaxed text-red-700"
            role="alert"
          >
            <p class="font-extrabold">Toko belum tampil di katalog</p>
            <p class="mt-1">
              Total stok 0. Isi stok minimal satu tier agar toko muncul lagi di katalog publik.
            </p>
          </div>

          <section v-else class="rounded-[2rem] border border-ink-900/10 bg-sage-200/70 p-5">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand-800">
              Tips
            </p>
            <p class="mt-2 text-xs leading-relaxed text-ink-700">
              Simpan stok sebelum jam pickup dimulai. Perubahan stok langsung mengurangi atau
              menambah kantong yang terlihat customer.
            </p>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>
