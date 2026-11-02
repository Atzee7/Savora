<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/error'
import { homePathForRole } from '@/utils/roleHome'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: 'customer@savora.id',
  password: 'password123',
})

const submitting = ref(false)
const error = ref('')

async function submit(): Promise<void> {
  if (submitting.value) {
    return
  }

  error.value = ''
  submitting.value = true

  try {
    await auth.login({ email: form.email, password: form.password })
    const fallback = homePathForRole(auth.role)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : fallback
    await router.push(redirect.startsWith('/') ? redirect : fallback)
  } catch (submitError) {
    error.value = getErrorMessage(submitError, 'Email atau password tidak valid.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="container-page py-10 sm:py-16">
    <div class="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-card lg:grid-cols-2">
      <div class="relative hidden flex-col justify-between overflow-hidden bg-brand-800 p-10 text-white lg:flex">
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" />
        <div class="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div class="relative">
          <div class="flex items-center gap-2.5">
            <span class="grid h-9 w-9 place-items-center rounded-xl bg-white text-base font-extrabold text-brand-800">S</span>
            <span class="text-lg font-extrabold">Savora</span>
          </div>
          <h1 class="mt-12 max-w-sm text-3xl font-extrabold leading-tight">
            Selamatkan makanan, hemat sampai 70%.
          </h1>
          <p class="mt-4 max-w-sm text-sm leading-relaxed text-brand-100">
            Masuk untuk memesan Surprise Bag, mengelola toko mitra, atau memantau operasional platform.
          </p>
        </div>
        <div class="relative space-y-3 text-sm text-brand-100">
          <p class="flex items-center gap-2"><span class="text-accent-300">✓</span> Tiket digital + PIN 4 digit</p>
          <p class="flex items-center gap-2"><span class="text-accent-300">✓</span> Pembayaran sandbox aman</p>
          <p class="flex items-center gap-2"><span class="text-accent-300">✓</span> Tanpa biaya layanan</p>
        </div>
      </div>

      <div class="p-6 sm:p-10">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Masuk</p>
        <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">Selamat datang kembali</h2>
        <p class="mt-2 text-sm text-stone-500">Gunakan akun Savora untuk melanjutkan.</p>

        <form class="mt-7 space-y-4" @submit.prevent="submit">
          <AppInput
            v-model="form.email"
            label="Email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            required
          />
          <AppInput
            v-model="form.password"
            label="Password"
            type="password"
            autocomplete="current-password"
            placeholder="Minimal 8 karakter"
            required
          />

          <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ error }}
          </div>

          <AppButton type="submit" size="lg" class="w-full" :loading="submitting">
            Masuk ke Savora
          </AppButton>
        </form>

        <div class="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-4 py-3">
          <p class="text-[11px] font-bold uppercase tracking-wide text-brand-700">Akun demo</p>
          <div class="mt-2 space-y-1 text-xs leading-relaxed text-brand-900/70">
            <p>Customer: <strong>customer@savora.id</strong></p>
            <p>Mitra: <strong>merchant@savora.id</strong></p>
            <p>Admin: <strong>admin@savora.id</strong></p>
            <p>Password semua akun: <strong>password123</strong></p>
          </div>
        </div>

        <p class="mt-6 text-center text-sm text-stone-500">
          Belum punya akun?
          <RouterLink to="/auth/register" class="font-bold text-brand-700 hover:underline">Daftar gratis</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
