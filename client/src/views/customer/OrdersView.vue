<script setup lang="ts">
import ComingSoon from '@/components/common/ComingSoon.vue'
</script>

<template>
  <ComingSoon
    eyebrow="Akun customer"
    title="Riwayat pesanan belum aktif"
    description="Setelah modul order selesai, semua tiket aktif dan riwayat transaksi akan muncul di sini."
    :steps="[
      'Daftar tiket aktif beserta sisa waktu pickup.',
      'Riwayat order COMPLETED, EXPIRED, dan CANCELLED.',
      'Ulasan biner setelah pesanan selesai.',
      'Tombol buka tiket dan lihat PIN.',
    ]"
  >
    <RouterLink
      to="/catalog"
      class="mt-6 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
    >
      Cari Surprise Bag
    </RouterLink>
  </ComingSoon>
</template>
