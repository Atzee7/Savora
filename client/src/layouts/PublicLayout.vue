<script setup lang="ts">
import SiteFooter from '@/components/layout/SiteFooter.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />

    <main class="flex-1">
      <RouterView />
    </main>

    <SiteFooter />
  </div>
</template>
