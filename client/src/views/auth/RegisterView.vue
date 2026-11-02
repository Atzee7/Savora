<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/error'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
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
    await auth.register({
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      password: form.password,
    })
    await router.push('/orders')
  } catch (submitError) {
    error.value = getErrorMessage(submitError, 'Pendaftaran gagal. Silakan coba lagi.')
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
            Mulai selamatkan makanan malam ini.
          </h1>
          <p class="mt-4 max-w-sm text-sm leading-relaxed text-brand-100">
            Daftar sekali, lalu pesan Surprise Bag dari toko favorit di Malang. Isi kejutan, harga pasti hemat.
          </p>
        </div>
        <div class="relative space-y-3 text-sm text-brand-100">
          <p class="flex items-center gap-2"><span class="text-accent-300">✓</span> Gratis, tanpa biaya pendaftaran</p>
          <p class="flex items-center gap-2"><span class="text-accent-300">✓</span> Maksimal 2 kantong per toko per hari</p>
          <p class="flex items-center gap-2"><span class="text-accent-300">✓</span> Pickup sendiri dengan PIN</p>
        </div>
      </div>

      <div class="p-6 sm:p-10">
        <p class="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Daftar customer</p>
        <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">Buat akun Savora</h2>
        <p class="mt-2 text-sm text-stone-500">Cukup 30 detik, langsung bisa pesan.</p>

        <form class="mt-7 space-y-4" @submit.prevent="submit">
          <AppInput
            v-model="form.name"
            label="Nama lengkap"
            autocomplete="name"
            placeholder="Nama kamu"
            required
          />
          <AppInput
            v-model="form.email"
            label="Email"
            type="email"
            autocomplete="email"
            placeholder="nama@email.com"
            required
          />
          <AppInput
            v-model="form.phone"
            label="Nomor WhatsApp (opsional)"
            type="tel"
            autocomplete="tel"
            placeholder="08xxxxxxxxxx"
            hint="Dipakai untuk membantu kasir jika ada kendala pickup."
          />
          <AppInput
            v-model="form.password"
            label="Password"
            type="password"
            autocomplete="new-password"
            placeholder="Minimal 8 karakter"
            required
          />

          <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ error }}
          </div>

          <AppButton type="submit" size="lg" class="w-full" :loading="submitting">
            Daftar sekarang
          </AppButton>
        </form>

        <p class="mt-4 text-xs leading-relaxed text-stone-400">
          Halaman ini hanya untuk akun customer. Akun mitra dibuat oleh admin Savora dan menggunakan halaman masuk yang sama.
        </p>

        <p class="mt-6 text-center text-sm text-stone-500">
          Sudah punya akun?
          <RouterLink to="/auth/login" class="font-bold text-brand-700 hover:underline">Masuk di sini</RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
