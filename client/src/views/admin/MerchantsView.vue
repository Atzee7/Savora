<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import AppInput from '@/components/common/AppInput.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
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

async function loadMerchants(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    merchants.value = await adminService.listMerchants()
  } catch (error) {
    loadError.value = getErrorMessage(error, 'Daftar mitra belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

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
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header class="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          Operasional / Mitra
        </p>
        <h1 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
          Mitra &amp; toko
        </h1>
        <p class="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">
          Akun mitra dibuat dari panel ini. Customer tidak bisa mendaftarkan diri sebagai mitra dari halaman publik.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800"
        @click="showForm = !showForm"
      >
        <span class="text-base leading-none">{{ showForm ? '×' : '+' }}</span>
        {{ showForm ? 'Tutup formulir' : 'Tambah mitra' }}
      </button>
    </header>

    <section class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div class="grid grid-cols-2 divide-x divide-y divide-stone-100 lg:grid-cols-4 lg:divide-y-0">
        <div class="px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Total mitra</p>
          <p class="mt-2 text-2xl font-extrabold text-stone-900">{{ stats.total }}</p>
        </div>
        <div class="px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Toko aktif</p>
          <p class="mt-2 text-2xl font-extrabold text-brand-700">{{ stats.active }}</p>
        </div>
        <div class="px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Menunggu</p>
          <p class="mt-2 text-2xl font-extrabold text-amber-700">{{ stats.pending }}</p>
        </div>
        <div class="px-4 py-4 sm:px-5">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Total kantong</p>
          <p class="mt-2 text-2xl font-extrabold text-stone-900">{{ stats.stock }}</p>
        </div>
      </div>
    </section>

    <div
      v-if="successMessage"
      class="mt-4 flex items-start justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900"
    >
      <p class="leading-relaxed">{{ successMessage }}</p>
      <button type="button" class="shrink-0 text-lg leading-none text-brand-700" @click="successMessage = ''">×</button>
    </div>

    <section v-if="showForm" class="mt-6 overflow-hidden rounded-xl border border-stone-300 bg-white">
      <div class="border-b border-stone-200 px-4 py-4 sm:px-6">
        <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Akun baru</p>
        <h2 class="mt-1 text-lg font-extrabold text-stone-900">Buat akun mitra &amp; toko</h2>
        <p class="mt-1 text-sm text-stone-500">
          Role mitra ditetapkan server. Toko langsung aktif dengan tiga tier dan stok awal 0.
        </p>
      </div>

      <form class="space-y-6 px-4 py-5 sm:px-6" @submit.prevent="submitMerchant">
        <div>
          <p class="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">Akun mitra</p>
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

        <div class="border-t border-stone-100 pt-5">
          <p class="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">Profil toko</p>
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
          <p class="mt-3 text-xs leading-relaxed text-stone-400">
            Latitude/longitude default berada di pusat Malang. Tempel link Google Maps di atas atau isi manual agar pin peta akurat.
          </p>
        </div>

        <div v-if="formError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {{ formError }}
        </div>

        <div class="flex flex-col-reverse gap-2 border-t border-stone-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            class="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
            @click="showForm = false"
          >
            Batal
          </button>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="submitting"
          >
            <span
              v-if="submitting"
              class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            {{ submitting ? 'Membuat akun...' : 'Buat akun mitra' }}
          </button>
        </div>
      </form>
    </section>

    <section class="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div class="flex flex-col gap-3 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <h2 class="text-sm font-extrabold text-stone-900">Daftar mitra</h2>
          <p class="mt-0.5 text-xs text-stone-400">{{ filteredMerchants.length }} akun ditampilkan</p>
        </div>
        <div class="flex items-center gap-2">
          <input
            v-model="search"
            type="search"
            class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 sm:w-56"
            placeholder="Cari mitra atau toko"
            aria-label="Cari mitra atau toko"
          />
          <button
            type="button"
            class="shrink-0 rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-500 transition hover:bg-stone-50"
            :disabled="loading"
            @click="loadMerchants"
          >
            Muat ulang
          </button>
        </div>
      </div>

      <div v-if="loading" class="space-y-3 p-4 sm:p-5">
        <div v-for="index in 5" :key="index" class="h-14 animate-pulse rounded-lg bg-stone-100" />
      </div>

      <div v-else-if="loadError" class="p-5">
        <EmptyState title="Daftar mitra gagal dimuat" :description="loadError">
          <template #icon>⚠️</template>
          <template #action>
            <button
              type="button"
              class="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white"
              @click="loadMerchants"
            >
              Coba lagi
            </button>
          </template>
        </EmptyState>
      </div>

      <div v-else-if="filteredMerchants.length === 0" class="p-5">
        <EmptyState
          title="Belum ada mitra yang cocok"
          description="Ubah kata pencarian atau buat akun mitra baru dari tombol di atas."
        >
          <template #icon>🏪</template>
        </EmptyState>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-stone-100 text-left text-sm">
          <thead class="bg-stone-50 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-400">
            <tr>
              <th class="px-4 py-3 sm:px-5">Mitra</th>
              <th class="px-4 py-3 sm:px-5">Toko</th>
              <th class="px-4 py-3 sm:px-5">Pickup</th>
              <th class="px-4 py-3 text-right sm:px-5">Stok</th>
              <th class="px-4 py-3 sm:px-5">Status</th>
              <th class="px-4 py-3 sm:px-5">Dibuat</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-stone-100">
            <tr v-for="merchant in filteredMerchants" :key="merchant.id" class="align-top hover:bg-stone-50/60">
              <td class="px-4 py-4 sm:px-5">
                <p class="font-bold text-stone-900">{{ merchant.name }}</p>
                <p class="mt-0.5 text-xs text-stone-500">{{ merchant.email }}</p>
                <p v-if="merchant.phone" class="mt-0.5 text-xs text-stone-400">{{ merchant.phone }}</p>
              </td>
              <td class="px-4 py-4 sm:px-5">
                <template v-if="merchant.store">
                  <p class="font-semibold text-stone-800">{{ merchant.store.storeName }}</p>
                  <p class="mt-0.5 max-w-xs text-xs leading-relaxed text-stone-500">{{ merchant.store.address }}</p>
                </template>
                <span v-else class="text-xs text-amber-700">Belum memiliki toko</span>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-xs text-stone-600 sm:px-5">
                <template v-if="merchant.store?.schedules[0]">
                  {{ formatTimeRange(merchant.store.schedules[0].pickupStart, merchant.store.schedules[0].pickupEnd) }}
                </template>
                <span v-else class="text-stone-400">Belum diatur</span>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-right font-mono text-sm font-bold text-stone-800 sm:px-5">
                {{ merchant.store?.totalStock ?? 0 }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 sm:px-5">
                <StatusBadge v-if="merchant.store" :status="merchant.store.status" />
                <span v-else class="text-xs text-stone-400">—</span>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-xs text-stone-500 sm:px-5">
                {{ formatDate(merchant.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
