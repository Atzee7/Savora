<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AuthFrame from '@/components/auth/AuthFrame.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'
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

const facts = [
  { label: 'Akun', value: 'Customer Savora' },
  { label: 'Batas', value: '2 kantong / toko / hari' },
  { label: 'Pembayaran', value: 'QRIS atau e-wallet' },
]

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
    await router.push('/')
  } catch (submitError) {
    error.value = getErrorMessage(submitError, 'Pendaftaran gagal. Silakan coba lagi.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthFrame
    image="/images/store-bakery.webp"
    image-alt="Croissant bertabur gula halus di atas papan batu"
    statement="Daftar malam ini, ambil kantong pertamamu."
    description="Satu akun untuk memesan Surprise Bag, menyimpan tiket pickup, dan memberi ulasan setelah mengambil pesanan."
    pass-label="Pass daftar / customer"
    heading="Buat akun customer"
    intro="Isi data di bawah. Akun langsung aktif dan siap dipakai memesan."
    :facts="facts"
  >
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
        hint="Dipakai kasir jika ada kendala saat pickup."
      />

      <PasswordInput
        v-model="form.password"
        label="Password"
        autocomplete="new-password"
        placeholder="Buat password"
        hint="Minimal 8 karakter."
        required
      />

      <div
        v-if="error"
        class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
        role="alert"
      >
        {{ error }}
      </div>

      <AppButton type="submit" variant="ink" size="lg" class="mt-1 w-full" :loading="submitting">
        Buat akun customer
      </AppButton>
    </form>

    <p class="mt-6 border-t border-dashed border-ink-900/20 pt-4 text-xs leading-relaxed text-ink-600">
      Pendaftaran publik hanya untuk akun customer. Akun mitra dibuat oleh admin Savora.
    </p>

    <template #switch>
      <p class="text-sm text-sage-200">
        Sudah punya akun?
        <RouterLink
          to="/auth/login"
          class="font-bold text-white underline decoration-brand-400/60 underline-offset-4 transition hover:text-brand-200"
        >
          Masuk di sini
        </RouterLink>
      </p>
    </template>
  </AuthFrame>
</template>
