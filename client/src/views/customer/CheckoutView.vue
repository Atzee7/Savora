<script setup lang="ts">
import ComingSoon from '@/components/common/ComingSoon.vue'

defineProps<{ tierId: string }>()
</script>

<template>
  <ComingSoon
    eyebrow="Checkout"
    title="Checkout sedang disiapkan"
    description="Halaman ini akan merangkum toko, tier, jumlah kantong, dan metode pembayaran sandbox sebelum pesanan dibuat."
    :steps="[
      'Validasi stok dan batas maksimal 2 kantong per toko per hari.',
      'Formulir kontak dan pilihan pembayaran QRIS / e-wallet.',
      'Membuat order PENDING dan mereservasi stok secara atomik.',
      'Lanjut ke halaman pembayaran sandbox.',
    ]"
  >
    <RouterLink
      to="/catalog"
      class="mt-6 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
    >
      Kembali ke katalog
    </RouterLink>
  </ComingSoon>
</template>
