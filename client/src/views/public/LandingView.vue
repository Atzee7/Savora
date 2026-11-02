<script setup lang="ts">
import { formatRupiah } from '@/utils/format'

const tierPreview = [
  {
    label: 'Hemat',
    price: 15000,
    original: 45000,
    emoji: '🥯',
    description: 'Camilan atau makan ringan untuk satu orang.',
  },
  {
    label: 'Reguler',
    price: 25000,
    original: 75000,
    emoji: '🥐',
    description: 'Paling seimbang untuk makan kenyang.',
  },
  {
    label: 'Besar',
    price: 35000,
    original: 105000,
    emoji: '🥖',
    description: 'Isi lebih banyak, cocok dibagi.',
  },
]
</script>

<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 via-stone-50 to-stone-50" />
      <div class="absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
      <div class="absolute -right-16 top-0 -z-10 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl" />

      <div class="container-page grid gap-14 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-brand-700">
            🌱 Food rescue hyper-local · Malang
          </span>
          <h1 class="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Makan enak,
            <span class="text-brand-700">selamatkan makanan</span>,
            hemat sampai 70%.
          </h1>
          <p class="mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Savora menghubungkan kamu dengan roti, kafe, dan restoran favorit di Malang yang punya surplus
            makanan layak konsumsi menjelang tutup. Pesan <em>Surprise Bag</em>, ambil sendiri, bayar jauh lebih murah.
          </p>

          <div class="mt-8 flex flex-wrap items-center gap-3">
            <RouterLink
              to="/catalog"
              class="inline-flex items-center justify-center rounded-full bg-brand-700 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-700/20 transition hover:-translate-y-0.5 hover:bg-brand-800"
            >
              Jelajahi Surprise Bag
            </RouterLink>
            <a
              href="#cara-kerja"
              class="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3.5 text-sm font-bold text-stone-700 transition hover:border-brand-300 hover:text-brand-700"
            >
              Lihat cara kerja
            </a>
          </div>

          <div class="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-xs font-semibold text-stone-500">
            <span class="flex items-center gap-2"><span class="text-brand-600">✓</span> 3 tier harga tetap</span>
            <span class="flex items-center gap-2"><span class="text-brand-600">✓</span> Self-pickup dengan PIN</span>
            <span class="flex items-center gap-2"><span class="text-brand-600">✓</span> Tanpa biaya layanan</span>
          </div>
        </div>

        <div class="relative mx-auto w-full max-w-md lg:mr-0">
          <div class="absolute -right-3 -top-3 z-10 rotate-3 rounded-2xl bg-accent-400 px-4 py-2 text-xs font-extrabold text-stone-900 shadow-lg">
            Hemat 67%
          </div>

          <div class="overflow-hidden rounded-[2rem] border border-brand-100 bg-white shadow-card">
            <div class="relative h-44 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-6 text-white">
              <div class="absolute -right-8 top-2 h-36 w-36 rounded-full border-[18px] border-white/10" />
              <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-100">Surprise Bag hari ini</p>
              <h2 class="mt-2 max-w-[15rem] text-2xl font-extrabold leading-tight">Roti artisanal sisa oven terakhir</h2>
              <p class="mt-2 text-sm text-brand-100">Roti Asri Lowokwaru · 1,2 km</p>
            </div>

            <div class="space-y-4 p-6">
              <div class="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
                <div>
                  <p class="text-[11px] font-bold uppercase tracking-wide text-stone-400">Tier Reguler</p>
                  <p class="mt-0.5 text-sm font-semibold text-stone-700">Senilai min. {{ formatRupiah(75000) }}</p>
                </div>
                <p class="text-xl font-extrabold text-brand-700">{{ formatRupiah(25000) }}</p>
              </div>

              <div class="flex items-center gap-2 text-xs font-semibold text-stone-500">
                <span class="rounded-full bg-brand-50 px-2.5 py-1 text-brand-700">Ambil 20.00–21.30 WIB</span>
                <span class="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Sisa 3 kantong</span>
              </div>

              <div class="flex items-center justify-between border-t border-dashed border-stone-200 pt-4">
                <div class="flex items-center gap-2 text-xs text-stone-500">
                  <span class="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-brand-700">PIN</span>
                  Tunjukkan PIN saat ambil
                </div>
                <span class="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white">4 8 2 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="border-y border-stone-200 bg-white">
      <div class="container-page grid grid-cols-2 divide-x divide-stone-100 sm:grid-cols-4">
        <div class="px-4 py-6 text-center sm:px-6">
          <p class="text-2xl font-extrabold text-brand-700">60–70%</p>
          <p class="mt-1 text-xs font-semibold text-stone-500">Lebih murah</p>
        </div>
        <div class="px-4 py-6 text-center sm:px-6">
          <p class="text-2xl font-extrabold text-brand-700">3</p>
          <p class="mt-1 text-xs font-semibold text-stone-500">Tier harga tetap</p>
        </div>
        <div class="px-4 py-6 text-center sm:px-6">
          <p class="text-2xl font-extrabold text-brand-700">4 digit</p>
          <p class="mt-1 text-xs font-semibold text-stone-500">PIN pickup aman</p>
        </div>
        <div class="px-4 py-6 text-center sm:px-6">
          <p class="text-2xl font-extrabold text-brand-700">0</p>
          <p class="mt-1 text-xs font-semibold text-stone-500">Biaya layanan</p>
        </div>
      </div>
    </section>

    <section id="cara-kerja" class="scroll-mt-20 py-16 sm:py-24">
      <div class="container-page">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Cara kerja</p>
          <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            Tiga langkah, makanan terselamatkan.
          </h2>
          <p class="mt-4 text-sm leading-relaxed text-stone-600 sm:text-base">
            Tanpa antre panjang, tanpa memilih satu per satu. Cukup pilih tier, bayar, lalu ambil di toko.
          </p>
        </div>

        <div class="mt-12 grid gap-5 md:grid-cols-3">
          <div class="card p-6">
            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">🔍</span>
            <p class="mt-5 text-xs font-bold text-brand-600">01</p>
            <h3 class="mt-1 text-lg font-bold text-stone-900">Pilih toko & tier</h3>
            <p class="mt-2 text-sm leading-relaxed text-stone-500">
              Lihat toko di sekitar Malang, cek sisa kantong dan jam pickup, lalu pilih tier Hemat, Reguler, atau Besar.
            </p>
          </div>
          <div class="card p-6">
            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-accent-50 text-2xl">💳</span>
            <p class="mt-5 text-xs font-bold text-accent-600">02</p>
            <h3 class="mt-1 text-lg font-bold text-stone-900">Bayar & dapat PIN</h3>
            <p class="mt-2 text-sm leading-relaxed text-stone-500">
              Checkout simulasi QRIS atau e-wallet. Setelah berhasil, tiket aktif dan PIN 4 digit langsung dibuat.
            </p>
          </div>
          <div class="card p-6">
            <span class="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-2xl">🎒</span>
            <p class="mt-5 text-xs font-bold text-orange-600">03</p>
            <h3 class="mt-1 text-lg font-bold text-stone-900">Ambil di toko</h3>
            <p class="mt-2 text-sm leading-relaxed text-stone-500">
              Datang di jam pickup, tunjukkan PIN ke kasir. Isi kantongnya kejutan, nilainya dijamin sesuai tier.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-white py-16 sm:py-24">
      <div class="container-page">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Tier standar</p>
            <h2 class="mt-3 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
              Harga jelas, isi tetap kejutan.
            </h2>
          </div>
          <p class="max-w-md text-sm leading-relaxed text-stone-500">
            Kami mengunci tiga tier agar kasir tidak perlu menghitung satu per satu. Setiap kantong berisi makanan
            dengan nilai asli minimal sesuai tier.
          </p>
        </div>

        <div class="mt-10 grid gap-5 md:grid-cols-3">
          <div v-for="tier in tierPreview" :key="tier.label" class="card p-6 transition hover:-translate-y-1 hover:shadow-card">
            <div class="flex items-center justify-between">
              <span class="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold text-stone-600">{{ tier.label }}</span>
              <span class="text-3xl">{{ tier.emoji }}</span>
            </div>
            <p class="mt-6 text-3xl font-extrabold text-stone-900">{{ formatRupiah(tier.price) }}</p>
            <p class="mt-1 text-xs font-semibold text-stone-400">Nilai asli min. {{ formatRupiah(tier.original) }}</p>
            <p class="mt-4 text-sm leading-relaxed text-stone-500">{{ tier.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <section id="untuk-mitra" class="scroll-mt-20 py-16 sm:py-24">
      <div class="container-page">
        <div class="relative overflow-hidden rounded-[2rem] bg-brand-900 p-8 text-white sm:p-12">
          <div class="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-brand-700/50 blur-2xl" />
          <div class="absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
          <div class="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-300">Untuk mitra toko</p>
              <h2 class="mt-3 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
                Selamatkan modal bahan baku, tanpa ribet menghitung sisa satu per satu.
              </h2>
              <p class="mt-4 max-w-xl text-sm leading-relaxed text-brand-100">
                Buka stok Surprise Bag harian, atur jam pickup, dan validasi PIN pembeli langsung dari dasbor kasir.
              </p>
              <ul class="mt-6 grid gap-2 text-sm text-brand-100 sm:grid-cols-2">
                <li class="flex items-center gap-2"><span class="text-accent-300">✓</span> Stok per tier dalam hitungan detik</li>
                <li class="flex items-center gap-2"><span class="text-accent-300">✓</span> Rekap penjualan harian</li>
                <li class="flex items-center gap-2"><span class="text-accent-300">✓</span> Terminal verifikasi PIN</li>
                <li class="flex items-center gap-2"><span class="text-accent-300">✓</span> Akun dibuat dan dikelola admin</li>
              </ul>
            </div>
            <div class="flex flex-col gap-3 lg:items-end">
              <RouterLink
                to="/auth/login"
                class="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-brand-900 transition hover:bg-brand-50"
              >
                Masuk sebagai mitra
              </RouterLink>
              <p class="max-w-xs text-xs leading-relaxed text-brand-300 lg:text-right">
                Akun mitra dibuat oleh admin Savora. Hubungi admin untuk bergabung, lalu masuk dengan kredensial yang diberikan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
