<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LiveBadge from '@/components/common/LiveBadge.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { adminService } from '@/services/admin.service'
import type { AdminMerchant } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatTimeRange } from '@/utils/format'
import { formatCoord, isShortMapsLink, parseMapsLink } from '@/utils/mapsLink'

const merchants = ref<AdminMerchant[]>([])
const loading = ref(true)
const loadError = ref('')
const search = ref('')

const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const successMessage = ref('')

const form = reactive({
  ownerName: '',
  email: '',
  phone: '',
  password: '',
  storeName: '',
  address: '',
  mapsLink: '',
  latitude: '-7.9666',
  longitude: '112.6326',
  pickupStart: '20:00',
  pickupEnd: '21:00',
})

const mapsError = ref('')
const mapsStatus = ref('')

function resetForm(): void {
  Object.assign(form, {
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    storeName: '',
    address: '',
    mapsLink: '',
    latitude: '-7.9666',
    longitude: '112.6326',
    pickupStart: '20:00',
    pickupEnd: '21:00',
  })
  mapsError.value = ''
  mapsStatus.value = ''
}

function applyCoords(latitude: number, longitude: number): void {
  form.latitude = formatCoord(latitude)
  form.longitude = formatCoord(longitude)
  mapsError.value = ''
  mapsStatus.value = `Koordinat terisi: ${formatCoord(latitude)}, ${formatCoord(longitude)}`
}

function applyMapsLink(): void {
  const value = form.mapsLink.trim()

  if (!value) {
    mapsError.value = ''
    mapsStatus.value = ''
    return
  }

  const coords = parseMapsLink(value)

  if (!coords) {
    mapsError.value = isShortMapsLink(value)
      ? 'Link pendek tidak memuat koordinat. Buka link itu, lalu salin URL lengkap dari address bar.'
      : 'Koordinat tidak ditemukan di link ini. Pastikan link berasal dari Google Maps.'
    mapsStatus.value = ''
    return
  }

  applyCoords(coords.latitude, coords.longitude)
}

function handleMapsPaste(event: ClipboardEvent): void {
  const text = event.clipboardData?.getData('text') ?? ''
  const coords = parseMapsLink(text)

  if (coords) {
    applyCoords(coords.latitude, coords.longitude)
  }
}

const filteredMerchants = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) {
    return merchants.value
  }

  return merchants.value.filter((merchant) => {
    const store = merchant.store
    return [merchant.name, merchant.email, store?.storeName, store?.address]
      .filter((value): value is string => Boolean(value))
      .some((value) => value.toLowerCase().includes(query))
  })
})

const stats = computed(() => {
  const active = merchants.value.filter((merchant) => merchant.store?.status === 'ACTIVE').length
  const pending = merchants.value.filter((merchant) => merchant.store?.status === 'PENDING').length
  const stock = merchants.value.reduce((total, merchant) => total + (merchant.store?.totalStock ?? 0), 0)

  return { total: merchants.value.length, active, pending, stock }
})

async function loadMerchants(options: { silent?: boolean } = {}): Promise<void> {
  const silent = options.silent === true

  if (!silent) {
    loading.value = true
    loadError.value = ''
  }

  try {
    merchants.value = await adminService.listMerchants()
    loadError.value = ''
    lastUpdated.value = new Date()
  } catch (error) {
    if (silent) {
      // Biarkan daftar terakhir tampil; badge tidak diperbarui pada percobaan gagal.
      throw error
    }

    loadError.value = getErrorMessage(error, 'Daftar mitra belum bisa dimuat.')
  } finally {
    if (!silent) {
      loading.value = false
    }
  }
}

const { lastUpdated, refresh } = useAutoRefresh(() => loadMerchants({ silent: true }), {
  interval: 20_000,
  enabled: () => !loading.value && !submitting.value,
})

async function submitMerchant(): Promise<void> {
  if (submitting.value) {
    return
  }

  formError.value = ''
  successMessage.value = ''

  const latitude = Number(form.latitude)
  const longitude = Number(form.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    formError.value = 'Latitude dan longitude harus berupa angka.'
    return
  }

  submitting.value = true

  try {
    const created = await adminService.createMerchant({
      ownerName: form.ownerName,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
      storeName: form.storeName,
      address: form.address,
      latitude,
      longitude,
      pickupStart: form.pickupStart,
      pickupEnd: form.pickupEnd,
    })

    merchants.value = [created, ...merchants.value]
    successMessage.value = `Akun mitra ${created.email} berhasil dibuat. Serahkan email dan password awal melalui kanal yang aman.`
    showForm.value = false
    resetForm()
  } catch (error) {
    formError.value = getErrorMessage(error, 'Akun mitra gagal dibuat.')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadMerchants()
})
</script>

<template>
  <div>
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
          Operasional / Mitra
        </p>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
          Mitra &amp; toko
        </h1>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
          Akun mitra dibuat dari panel ini. Customer tidak bisa mendaftarkan diri sebagai mitra dari
          halaman publik.
        </p>
        <div class="mt-4">
          <LiveBadge :updated-at="lastUpdated" label="Otomatis" />
        </div>
      </div>

      <AppButton variant="ink" size="md" @click="showForm = !showForm">
        <span class="text-base leading-none" aria-hidden="true">{{ showForm ? '×' : '+' }}</span>
        {{ showForm ? 'Tutup formulir' : 'Tambah mitra' }}
      </AppButton>
    </header>

    <section
      class="mt-8 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-ink-900/10 shadow-card"
    >
      <div class="grid grid-cols-2 gap-px lg:grid-cols-4">
        <div class="bg-white px-5 py-5 sm:px-6">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Total mitra</p>
          <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">{{ stats.total }}</p>
        </div>
        <div class="bg-white px-5 py-5 sm:px-6">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Toko aktif</p>
          <p class="mt-2 text-2xl font-extrabold tracking-tight text-brand-700">{{ stats.active }}</p>
        </div>
        <div class="bg-white px-5 py-5 sm:px-6">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">Menunggu</p>
          <p
            class="mt-2 text-2xl font-extrabold tracking-tight"
            :class="stats.pending > 0 ? 'text-red-700' : 'text-ink-950'"
          >
            {{ stats.pending }}
          </p>
        </div>
        <div class="bg-white px-5 py-5 sm:px-6">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
            Total kantong
          </p>
          <p class="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">{{ stats.stock }}</p>
        </div>
      </div>
    </section>

    <div
      v-if="successMessage"
      class="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800"
      role="status"
    >
      <p class="leading-relaxed">{{ successMessage }}</p>
      <button
        type="button"
        class="shrink-0 text-lg leading-none text-brand-700"
        aria-label="Tutup pesan"
        @click="successMessage = ''"
      >
        ×
      </button>
    </div>

    <section
      v-if="showForm"
      class="mt-6 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
    >
      <div class="border-b border-ink-900/10 px-5 py-5 sm:px-6">
        <p class="text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-700">
          Akun baru
        </p>
        <h2 class="mt-1 text-lg font-extrabold tracking-tight text-ink-950">
          Buat akun mitra &amp; toko
        </h2>
        <p class="mt-1 text-sm leading-relaxed text-ink-600">
          Role mitra ditetapkan server. Toko langsung aktif dengan tiga tier dan stok awal 0.
        </p>
      </div>

      <form class="space-y-6 px-5 py-5 sm:px-6" @submit.prevent="submitMerchant">
        <div>
          <p class="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-500">
            Akun mitra
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <AppInput v-model="form.ownerName" label="Nama pemilik / kasir" autocomplete="name" required />
            <AppInput v-model="form.email" label="Email login" type="email" autocomplete="email" required />
            <AppInput v-model="form.phone" label="Nomor HP (opsional)" type="tel" autocomplete="tel" />
            <AppInput
              v-model="form.password"
              label="Password awal"
              type="password"
              autocomplete="new-password"
              hint="Minimal 8 karakter. Serahkan ke mitra melalui kanal aman."
              required
            />
          </div>
        </div>

        <div class="border-t border-ink-900/10 pt-5">
          <p class="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink-500">
            Profil toko
          </p>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <AppInput v-model="form.storeName" label="Nama toko" required />
            </div>
            <div class="sm:col-span-2">
              <label class="label" for="merchant-address">Alamat</label>
              <textarea
                id="merchant-address"
                v-model="form.address"
                rows="2"
                class="input resize-y"
                placeholder="Nama jalan, nomor, kecamatan, Malang"
                required
              />
            </div>
            <div class="sm:col-span-2">
              <AppInput
                v-model="form.mapsLink"
                label="Link Google Maps (opsional)"
                placeholder="https://www.google.com/maps/place/..."
                autocomplete="off"
                hint="Tempel link tempat dari Google Maps, koordinat terisi otomatis."
                :error="mapsError || undefined"
                @paste="handleMapsPaste"
                @blur="applyMapsLink"
              />
              <p v-if="mapsStatus && !mapsError" class="mt-1.5 text-xs font-semibold text-brand-700">
                {{ mapsStatus }}
              </p>
            </div>
            <AppInput v-model="form.latitude" label="Latitude" type="number" step="any" required />
            <AppInput v-model="form.longitude" label="Longitude" type="number" step="any" required />
            <AppInput v-model="form.pickupStart" label="Pickup mulai" type="time" required />
            <AppInput v-model="form.pickupEnd" label="Pickup selesai" type="time" required />
          </div>
          <p class="mt-3 text-xs leading-relaxed text-ink-500">
            Latitude/longitude default berada di pusat Malang. Tempel link Google Maps di atas atau
            isi manual agar pin peta akurat.
          </p>
        </div>

        <div
          v-if="formError"
          class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {{ formError }}
        </div>

        <div class="flex flex-col-reverse gap-2 border-t border-ink-900/10 pt-5 sm:flex-row sm:justify-end">
          <AppButton variant="secondary" size="md" @click="showForm = false">Batal</AppButton>
          <AppButton
            type="submit"
            variant="primary"
            size="md"
            :loading="submitting"
            :disabled="submitting"
          >
            {{ submitting ? 'Membuat akun...' : 'Buat akun mitra' }}
          </AppButton>
        </div>
      </form>
    </section>

    <section
      class="mt-6 overflow-hidden rounded-[2rem] border border-ink-900/10 bg-white shadow-card"
    >
      <div
        class="flex flex-col gap-3 border-b border-ink-900/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div>
          <h2 class="text-lg font-extrabold tracking-tight text-ink-950">Daftar mitra</h2>
          <p class="mt-0.5 text-xs text-ink-600">{{ filteredMerchants.length }} akun ditampilkan</p>
        </div>
        <div class="flex w-full items-center gap-2 sm:w-auto">
          <input
            v-model="search"
            type="search"
            class="input w-full sm:w-60"
            placeholder="Cari mitra atau toko"
            aria-label="Cari mitra atau toko"
          />
          <AppButton variant="secondary" size="sm" :disabled="loading" @click="refresh()">
            Muat ulang
          </AppButton>
        </div>
      </div>

      <div v-if="loading" class="space-y-3 p-5 sm:p-6">
        <div v-for="index in 5" :key="index" class="h-14 animate-pulse rounded-2xl bg-sage-200" />
      </div>

      <div v-else-if="loadError" class="p-5 sm:p-6">
        <EmptyState title="Daftar mitra gagal dimuat" :description="loadError">
          <template #icon>⚠️</template>
          <template #action>
            <AppButton variant="ink" @click="loadMerchants()">Coba lagi</AppButton>
          </template>
        </EmptyState>
      </div>

      <div v-else-if="filteredMerchants.length === 0" class="p-5 sm:p-6">
        <EmptyState
          title="Belum ada mitra yang cocok"
          description="Ubah kata pencarian atau buat akun mitra baru dari tombol di atas."
        >
          <template #icon>🏪</template>
        </EmptyState>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-ink-900/10 text-left text-sm">
          <thead class="bg-sage-50 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-500">
            <tr>
              <th class="px-5 py-3 sm:px-6">Mitra</th>
              <th class="px-5 py-3 sm:px-6">Toko</th>
              <th class="px-5 py-3 sm:px-6">Pickup</th>
              <th class="px-5 py-3 text-right sm:px-6">Stok</th>
              <th class="px-5 py-3 sm:px-6">Status</th>
              <th class="px-5 py-3 sm:px-6">Dibuat</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-900/10">
            <tr
              v-for="merchant in filteredMerchants"
              :key="merchant.id"
              class="align-top transition hover:bg-sage-50"
            >
              <td class="px-5 py-4 sm:px-6">
                <p class="font-extrabold text-ink-950">{{ merchant.name }}</p>
                <p class="mt-0.5 text-xs text-ink-600">{{ merchant.email }}</p>
                <p v-if="merchant.phone" class="mt-0.5 text-xs text-ink-500">{{ merchant.phone }}</p>
              </td>
              <td class="px-5 py-4 sm:px-6">
                <template v-if="merchant.store">
                  <p class="font-semibold text-ink-900">{{ merchant.store.storeName }}</p>
                  <p class="mt-0.5 max-w-xs text-xs leading-relaxed text-ink-600">
                    {{ merchant.store.address }}
                  </p>
                </template>
                <span v-else class="text-xs font-semibold text-red-700">Belum memiliki toko</span>
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-xs text-ink-600 sm:px-6">
                <template v-if="merchant.store?.schedules[0]">
                  {{
                    formatTimeRange(
                      merchant.store.schedules[0].pickupStart,
                      merchant.store.schedules[0].pickupEnd,
                    )
                  }}
                </template>
                <span v-else class="text-ink-500">Belum diatur</span>
              </td>
              <td
                class="whitespace-nowrap px-5 py-4 text-right font-mono text-sm font-bold text-ink-900 sm:px-6"
              >
                {{ merchant.store?.totalStock ?? 0 }}
              </td>
              <td class="whitespace-nowrap px-5 py-4 sm:px-6">
                <StatusBadge v-if="merchant.store" :status="merchant.store.status" />
                <span v-else class="text-xs text-ink-500">—</span>
              </td>
              <td class="whitespace-nowrap px-5 py-4 text-xs text-ink-600 sm:px-6">
                {{ formatDate(merchant.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
