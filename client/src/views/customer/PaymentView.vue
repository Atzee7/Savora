<script setup lang="ts">
import ComingSoon from '@/components/common/ComingSoon.vue'

defineProps<{ orderId: string }>()
</script>

<template>
  <ComingSoon
    eyebrow="Pembayaran"
    title="Pembayaran sandbox segera hadir"
    description="Di tahap ini sistem akan mensimulasikan pembayaran QRIS atau e-wallet, lalu mengubah status order menjadi PAID."
    :steps="[
      'Menampilkan ringkasan order dan hitung mundur 15 menit.',
      'Tombol bayar memicu mock payment tanpa gateway sungguhan.',
      'Sistem menggenerate PIN 4 digit yang unik.',
      'Customer diarahkan ke tiket digital.',
    ]"
  >
    <RouterLink
      to="/orders"
      class="mt-6 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
    >
      Ke halaman pesanan
    </RouterLink>
  </ComingSoon>
</template>
