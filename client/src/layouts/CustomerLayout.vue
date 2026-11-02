<script setup lang="ts">
import SiteFooter from '@/components/layout/SiteFooter.vue'
import SiteHeader from '@/components/layout/SiteHeader.vue'
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteHeader />

    <main class="flex-1">
      <div class="container-page py-10 sm:py-14">
        <RouterView />
      </div>
    </main>

    <SiteFooter compact />
  </div>
</template>
