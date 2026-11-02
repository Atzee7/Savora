<script setup lang="ts">
import ComingSoon from '@/components/common/ComingSoon.vue'

defineProps<{ orderId: string }>()
</script>

<template>
  <ComingSoon
    eyebrow="Tiket pickup"
    title="Tiket digital sedang disiapkan"
    description="Tiket aktif akan menampilkan PIN besar, QR visual, peta lokasi toko, dan hitung mundur batas pickup."
    :steps="[
      'PIN 4 digit untuk ditunjukkan ke kasir.',
      'Countdown sampai jam pickup berakhir.',
      'Peta lokasi dan alamat lengkap toko.',
      'Status order yang diperbarui setelah verifikasi.',
    ]"
  >
    <RouterLink
      to="/orders"
      class="mt-6 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
    >
      Lihat semua pesanan
    </RouterLink>
  </ComingSoon>
</template>
