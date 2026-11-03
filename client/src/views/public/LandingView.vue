<script setup lang="ts">
import { onMounted } from 'vue'

import FeatureCard from '@/components/home/FeatureCard.vue'
import StepItem from '@/components/home/StepItem.vue'
import TierCard from '@/components/home/TierCard.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useAuthStore } from '@/stores/auth'
import { useCatalogStore } from '@/stores/catalog'

const auth = useAuthStore()
const catalog = useCatalogStore()

useAutoRefresh(() => catalog.refreshStores(), { interval: 30_000 })

const stats = [
  { icon: 'tier', value: '3', label: 'Tier harga tetap' },
  { icon: 'save', value: '70%', label: 'Hemat maksimal' },
  { icon: 'area', value: '5', label: 'Area layanan' },
] as const

const features = [
  {
    icon: 'leaf',
    title: 'Surplus yang masih layak',
    description:
      'Toko hanya menjual makanan yang tidak habis di hari itu, bukan makanan yang sudah tidak layak.',
  },
  {
    icon: 'tag',
    title: 'Harga pasti, isi kejutan',
    description:
      'Pilih tier Hemat, Reguler, atau Besar. Nilai asli setiap kantong dijamin sesuai tier.',
  },
  {
    icon: 'ticket',
    title: 'Ambil sendiri dengan PIN',
    description:
      'Bayar sekali, dapat tiket digital dan PIN 4 digit, lalu ambil di toko pada jam pickup.',
  },
] as const

const steps = [
  {
    icon: 'bag',
    title: 'Pilih toko dan tier',
    description:
      'Lihat toko yang buka malam ini, cek jam pickup dan sisa kantong, lalu pilih tier yang paling pas.',
  },
  {
    icon: 'card',
    title: 'Bayar dan dapat PIN',
    description:
      'Selesaikan pembayaran sandbox. Tiket aktif dan PIN 4 digit langsung dibuat untuk pickup.',
  },
  {
    icon: 'pin',
    title: 'Ambil di jam pickup',
    description:
      'Datang ke toko, tunjukkan PIN ke kasir, lalu bawa pulang Surprise Bag kamu.',
  },
] as const

const tierCards = [
  {
    name: 'Hemat',
    price: 15000,
    original: 45000,
    image: '/images/store-bakery.webp',
    description: 'Camilan atau makan ringan untuk satu orang.',
  },
  {
    name: 'Reguler',
    price: 25000,
    original: 75000,
    image: '/images/tier-reguler.webp',
    description: 'Porsi makan lengkap, pas untuk satu orang lapar.',
  },
  {
    name: 'Besar',
    price: 35000,
    original: 105000,
    image: '/images/tier-besar.webp',
    description: 'Isi lebih banyak, cocok dibagi atau disimpan.',
  },
] as const

onMounted(() => {
  void catalog.fetchStores()
})
</script>

<template>
  <div>
    <section class="pt-5 sm:pt-8">
      <div class="container-page">
        <div class="relative overflow-hidden rounded-[2rem] bg-ink-950">
          <img
            src="/images/hero-savora.webp"
            alt="Rak roti dan pastry di toko roti menjelang tutup"
            class="absolute inset-0 h-full w-full object-cover object-center"
            fetchpriority="high"
          />
          <div
            class="absolute inset-0 bg-gradient-to-b from-ink-950/75 via-ink-950/35 to-ink-950/85"
          />

          <div
            class="relative flex min-h-[34rem] flex-col justify-between p-6 sm:min-h-[38rem] sm:p-10 lg:min-h-[42rem] lg:p-14"
          >
            <div class="flex items-start justify-end gap-4">
              <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-sage-100">
                Malang, ID
              </span>
            </div>

            <div class="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <h1
                class="select-none pl-[0.12em] text-[clamp(3rem,14vw,10.5rem)] font-extrabold leading-none tracking-[0.12em] text-white"
              >
                SAVORA
              </h1>
              <p class="mt-5 max-w-xl text-sm leading-relaxed text-sage-100 sm:text-base">
                Selamatkan makanan layak dari toko Malang. Pesan Surprise Bag, ambil sendiri, bayar
                hingga 70 persen lebih murah.
              </p>

              <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
                <RouterLink
                  to="/catalog"
                  class="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold text-ink-950 transition hover:bg-sage-100"
                >
                  Cari Surprise Bag
                </RouterLink>
                <a
                  href="#cara-kerja"
                  class="inline-flex min-h-12 items-center justify-center rounded-full border border-white/40 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Lihat cara kerja
                </a>
              </div>
            </div>

            <div
              class="flex flex-wrap items-center justify-end gap-3 border-t border-white/15 pt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-sage-200"
            >
              <span>Pickup malam ini</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white py-16 sm:py-24">
      <div class="container-page grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-20">
        <div v-reveal>
          <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
            Kenapa Savora
          </p>
          <h2
            class="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-tight text-ink-950 sm:text-4xl"
          >
            Makan malam lebih murah, tanpa rasa bersalah.
          </h2>
          <p class="mt-5 max-w-lg text-sm leading-relaxed text-ink-600 sm:text-base">
            Savora bukan aplikasi diskon biasa. Kami bekerja dengan toko di Malang untuk menjual
            makanan yang masih layak sebelum tutup, dalam paket yang isinya kejutan.
          </p>

          <div class="mt-10 grid grid-cols-3 gap-4 sm:gap-6">
            <div v-for="stat in stats" :key="stat.label">
              <span
                class="grid h-11 w-11 place-items-center rounded-full border border-ink-900/15 text-ink-900"
              >
                <svg
                  v-if="stat.icon === 'tier'"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <path d="M4 7h16M7 12h10M10 17h4" />
                </svg>
                <svg
                  v-else-if="stat.icon === 'save'"
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="m8.5 15.5 7-7M9 9.5h.01M15 14.5h.01" />
                </svg>
                <svg
                  v-else
                  class="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
              </span>
              <p class="mt-4 text-2xl font-extrabold tracking-tight text-ink-950">
                {{ stat.value }}
              </p>
              <p class="mt-1 text-xs font-semibold leading-snug text-ink-500">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <div class="grid gap-4">
          <FeatureCard
            v-for="(feature, index) in features"
            :key="feature.title"
            v-reveal="{ delay: index * 80 }"
            :icon="feature.icon"
            :title="feature.title"
            :description="feature.description"
          />
        </div>
      </div>
    </section>

    <section class="pb-16 sm:pb-24">
      <div class="container-page">
        <div class="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div v-reveal class="max-w-xl">
            <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
              Satu harga, tiga ukuran
            </p>
            <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
              Tiga tier, isi selalu kejutan.
            </h2>
            <p class="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
              Hemat, Reguler, dan Besar. Nilai asli setiap kantong dijamin sesuai tier, tanpa
              kejutan harga.
            </p>
          </div>

          <RouterLink
            to="/catalog"
            class="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-800"
          >
            Lihat katalog
            <svg
              class="h-4 w-4"
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
          </RouterLink>
        </div>

        <div class="mt-10 grid gap-4 lg:mt-12 lg:grid-cols-3 lg:gap-5">
          <TierCard
            v-for="(tier, index) in tierCards"
            :key="tier.name"
            v-reveal="{ delay: index * 80 }"
            :index="index + 1"
            :name="tier.name"
            :price="tier.price"
            :original="tier.original"
            :image="tier.image"
            :description="tier.description"
            :featured="index === 1"
            class="lg:last:mt-8 lg:first:mt-8"
          />
        </div>

        <div
          v-reveal
          class="mt-6 flex flex-col gap-2 rounded-2xl border border-ink-900/10 bg-white/60 px-5 py-4 text-xs font-semibold text-ink-600 sm:flex-row sm:items-center sm:justify-between"
        >
          <p>Harga tier sama di semua toko. Isi kantong mengikuti stok hari itu.</p>
          <p class="text-ink-600">Ambil sendiri di toko pada jam pickup.</p>
        </div>
      </div>
    </section>

    <section id="cara-kerja" class="scroll-mt-24 bg-white py-16 sm:py-24">
      <div class="container-page">
        <div class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <div v-reveal>
            <p class="text-[11px] font-extrabold uppercase tracking-[0.22em] text-brand-700">
              Cara kerja
            </p>
            <h2
              class="mt-4 max-w-xl text-3xl font-extrabold leading-[1.05] tracking-tight text-ink-950 sm:text-4xl lg:text-5xl"
            >
              Pesan semudah 1-2-3.
            </h2>
          </div>

          <p v-reveal="{ delay: 80 }" class="max-w-md text-sm leading-relaxed text-ink-600 sm:text-base lg:pb-1">
            Tiga langkah dari memilih kantong sampai membawanya pulang. Semua pengambilan dilakukan
            sendiri di toko pada jam pickup.
          </p>
        </div>

        <div class="mt-10 border-t border-ink-900/10 lg:mt-14" aria-hidden="true" />

        <div class="relative mt-10 lg:mt-12">
          <span
            class="pointer-events-none absolute left-7 right-7 top-7 hidden border-t border-dashed border-ink-900/20 lg:block"
            aria-hidden="true"
          />

          <ol class="relative grid gap-10 lg:grid-cols-3 lg:gap-8">
            <StepItem
              v-for="(step, index) in steps"
              :key="step.title"
              v-reveal="{ delay: index * 90 }"
              :index="index + 1"
              :icon="step.icon"
              :title="step.title"
              :description="step.description"
              :last="index === steps.length - 1"
            />
          </ol>
        </div>

        <div
          v-reveal
          class="mt-12 flex flex-col gap-5 border-t border-ink-900/10 pt-8 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="max-w-md text-sm leading-relaxed text-ink-600">
            Stok dibuka menjelang jam pickup. Setiap kantong dijamin sesuai nilai tier yang kamu
            pilih.
          </p>

          <div class="flex flex-wrap items-center gap-2">
            <RouterLink
              to="/catalog"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              Cari Surprise Bag
              <svg
                class="h-4 w-4"
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
            </RouterLink>

            <RouterLink
              v-if="auth.isAuthenticated && auth.role === 'CUSTOMER'"
              to="/orders"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-900/20 px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-sage-100"
            >
              Pesanan saya
            </RouterLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
