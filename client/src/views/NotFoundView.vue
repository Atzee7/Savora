<script setup lang="ts">
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-stone-50 px-6 py-16">
    <div class="max-w-md text-center">
      <p class="text-6xl font-extrabold tracking-tight text-brand-700">404</p>
      <h1 class="mt-4 text-2xl font-extrabold text-stone-900">Halaman tidak ditemukan</h1>
      <p class="mt-3 text-sm leading-relaxed text-stone-500">
        Sepertinya halaman yang kamu cari sudah dipindahkan atau tidak pernah ada.
      </p>
      <RouterLink
        to="/"
        class="mt-7 inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Kembali ke beranda
      </RouterLink>
    </div>
  </main>
</template>
