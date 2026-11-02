<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthFrame from '@/components/auth/AuthFrame.vue'
import PasswordInput from '@/components/auth/PasswordInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppInput from '@/components/common/AppInput.vue'
import { useAuthStore } from '@/stores/auth'
import { getErrorMessage } from '@/utils/error'
import { homePathForRole } from '@/utils/roleHome'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({
  email: '',
  password: '',
})

const submitting = ref(false)
const error = ref('')
const demoFilled = ref(false)

const facts = [
  { label: 'Tier harga', value: 'Rp15rb / Rp25rb / Rp35rb' },
  { label: 'Pickup', value: 'PIN 4 digit di toko' },
  { label: 'Biaya layanan', value: 'Gratis' },
]

function fillDemo(): void {
  form.email = 'customer@savora.id'
  form.password = 'password123'
  error.value = ''
  demoFilled.value = true
}

async function submit(): Promise<void> {
  if (submitting.value) {
    return
  }

  error.value = ''
  demoFilled.value = false
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
  <AuthFrame
    image="/images/store-coffee.webp"
    image-alt="Tiga cangkir kopi susu dengan latte art di atas meja kayu"
    statement="Sisa hari ini masih layak jadi makan malam."
    description="Masuk untuk memesan Surprise Bag, membuka tiket pickup, dan mengelola pesananmu di Malang."
    pass-label="Pass masuk / customer"
    heading="Masuk ke akun Savora"
    intro="Pakai email dan password yang sama seperti saat mendaftar."
    :facts="facts"
  >
    <form class="mt-7 space-y-4" @submit.prevent="submit">
      <AppInput
        v-model="form.email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="nama@email.com"
        required
      />

      <PasswordInput
        v-model="form.password"
        label="Password"
        autocomplete="current-password"
        placeholder="Password kamu"
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
        Masuk ke Savora
      </AppButton>
    </form>

    <div class="mt-6 border-t border-dashed border-ink-900/20 pt-5">
      <p class="text-[11px] font-extrabold uppercase tracking-[0.18em] text-ink-600">Akun demo</p>
      <p class="mt-1.5 text-xs leading-relaxed text-ink-600">
        Isi otomatis akun customer demo, lalu tekan Masuk.
      </p>
      <button
        type="button"
        class="mt-3 inline-flex min-h-11 items-center justify-center rounded-full border border-ink-900/15 bg-white px-4 py-2 text-xs font-bold text-ink-900 transition hover:border-ink-900/30 hover:bg-sage-100"
        @click="fillDemo"
      >
        Isi akun demo
      </button>
      <p v-if="demoFilled" role="status" class="mt-2 text-xs font-bold text-brand-700">
        Akun demo terisi. Tekan Masuk untuk melanjutkan.
      </p>
    </div>

    <template #switch>
      <p class="text-sm text-sage-200">
        Belum punya akun?
        <RouterLink
          to="/auth/register"
          class="font-bold text-white underline decoration-brand-400/60 underline-offset-4 transition hover:text-brand-200"
        >
          Daftar akun customer
        </RouterLink>
      </p>
    </template>
  </AuthFrame>
</template>
