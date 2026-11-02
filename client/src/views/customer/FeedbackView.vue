<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EmptyState from '@/components/common/EmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatRupiah } from '@/utils/format'

const props = defineProps<{ orderId: string }>()

const order = ref<Order | null>(null)
const loading = ref(true)
const loadError = ref('')
const selected = ref<boolean | null>(null)
const comment = ref('')
const submitting = ref(false)
const submitError = ref('')

const tierLabels: Record<TierName, string> = {
  HEMAT: 'Tier Hemat',
  REGULER: 'Tier Reguler',
  BESAR: 'Tier Besar',
}

const canSubmit = computed(() => selected.value !== null && !submitting.value)
const isCompleted = computed(() => order.value?.status === 'COMPLETED')

async function load(): Promise<void> {
  loading.value = true
  loadError.value = ''

  try {
    order.value = await orderService.getById(props.orderId)
  } catch (error) {
    order.value = null
    loadError.value = getErrorMessage(error, 'Pesanan belum bisa dimuat.')
  } finally {
    loading.value = false
  }
}

async function submit(): Promise<void> {
  if (!order.value || selected.value === null || submitting.value) {
    return
  }

  submitting.value = true
  submitError.value = ''

  try {
    order.value = await orderService.submitFeedback(order.value.id, {
      isSatisfied: selected.value,
      comment: comment.value.trim() || undefined,
    })
  } catch (error) {
    submitError.value = getErrorMessage(error, 'Ulasan belum bisa dikirim.')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void load()
})
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <RouterLink
      to="/orders"
      class="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition hover:text-brand-700"
    >
      <span aria-hidden="true">←</span> Kembali ke pesanan
    </RouterLink>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-40 animate-pulse rounded-[2rem] bg-stone-200" />
      <div class="h-72 animate-pulse rounded-3xl bg-stone-200" />
    </div>

    <div v-else-if="loadError || !order" class="mt-6">
      <EmptyState title="Pesanan tidak ditemukan" :description="loadError">
        <template #icon>⚠️</template>
        <template #action>
          <RouterLink
            to="/orders"
            class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Lihat semua pesanan
          </RouterLink>
        </template>
      </EmptyState>
    </div>

    <div v-else-if="!isCompleted" class="mt-6">
      <EmptyState
        title="Ulasan belum tersedia"
        :description="
          order.status === 'PAID'
            ? 'Ulasan bisa dikirim setelah kasir memverifikasi PIN pickup kamu.'
            : 'Ulasan hanya tersedia untuk pesanan yang sudah selesai diambil.'
        "
      >
        <template #icon>💬</template>
        <template #action>
          <div class="flex flex-col gap-2 sm:flex-row">
            <RouterLink
              v-if="order.status === 'PAID'"
              :to="{ name: 'ticket', params: { orderId: order.id } }"
              class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Buka tiket
            </RouterLink>
            <RouterLink
              to="/orders"
              class="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
            >
              Kembali ke pesanan
            </RouterLink>
          </div>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <header class="relative mt-6 overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-800 px-6 py-7 text-white sm:px-8">
        <div class="absolute -right-10 -top-16 h-52 w-52 rounded-full border-[20px] border-white/10" />
        <div class="relative">
          <div class="flex flex-wrap items-center gap-2">
            <StatusBadge :status="order.status" />
            <span class="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">
              Order {{ order.id.slice(0, 8).toUpperCase() }}
            </span>
          </div>
          <p class="mt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">
            Ulasan pesanan
          </p>
          <h1 class="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            {{ order.feedback ? 'Ulasan sudah terkirim' : 'Bagaimana isi kantongmu?' }}
          </h1>
          <p class="mt-2 max-w-xl text-sm leading-relaxed text-brand-100">
            {{ order.store.storeName }} · {{ tierLabels[order.tier.name] }} × {{ order.qty }} ·
            {{ formatRupiah(order.totalPrice) }}
          </p>
        </div>
      </header>

      <section v-if="order.feedback" class="card mt-6 p-6 sm:p-8">
        <div class="flex flex-col items-center text-center">
          <span
            class="grid h-16 w-16 place-items-center rounded-2xl text-3xl"
            :class="order.feedback.isSatisfied ? 'bg-brand-100' : 'bg-amber-100'"
          >
            {{ order.feedback.isSatisfied ? '👍' : '👎' }}
          </span>
          <p class="mt-4 text-lg font-extrabold text-stone-900">
            {{ order.feedback.isSatisfied ? 'Kamu menilai isi kantong sesuai' : 'Kamu menilai isi kantong tidak sesuai' }}
          </p>
          <p class="mt-1 max-w-md text-sm leading-relaxed text-stone-500">
            Terima kasih, ulasan ini membantu Savora menjaga kualitas mitra. Ulasan tidak dapat diubah setelah dikirim.
          </p>

          <blockquote
            v-if="order.feedback.comment"
            class="mt-5 w-full rounded-2xl border border-stone-200 bg-stone-50 px-5 py-4 text-left text-sm leading-relaxed text-stone-700"
          >
            “{{ order.feedback.comment }}”
          </blockquote>

          <p class="mt-4 text-xs text-stone-400">Dikirim {{ formatDate(order.feedback.createdAt) }}</p>

          <div class="mt-6 flex flex-col gap-2 sm:flex-row">
            <RouterLink
              to="/orders"
              class="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Lihat pesanan saya
            </RouterLink>
            <RouterLink
              to="/catalog"
              class="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-50"
            >
              Cari Surprise Bag
            </RouterLink>
          </div>
        </div>
      </section>

      <form v-else class="mt-6 space-y-5" @submit.prevent="submit">
        <section class="card p-5 sm:p-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold uppercase tracking-[0.12em] text-stone-400">
                Pertanyaan singkat
              </h2>
              <p class="mt-1 text-sm text-stone-600">Apakah isi Surprise Bag sesuai dengan ekspektasi tier kamu?</p>
            </div>
            <span class="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-500">
              Wajib dipilih
            </span>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-2xl border-2 p-5 text-left transition"
              :class="
                selected === true
                  ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100'
                  : 'border-stone-200 bg-white hover:border-brand-300'
              "
              :aria-pressed="selected === true"
              @click="selected = true"
            >
              <span class="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-2xl">👍</span>
              <span class="mt-3 block text-base font-extrabold text-stone-900">Sesuai</span>
              <span class="mt-1 block text-sm leading-relaxed text-stone-500">
                Isi layak, porsi sesuai tier, dan memuaskan.
              </span>
            </button>

            <button
              type="button"
              class="rounded-2xl border-2 p-5 text-left transition"
              :class="
                selected === false
                  ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-100'
                  : 'border-stone-200 bg-white hover:border-amber-300'
              "
              :aria-pressed="selected === false"
              @click="selected = false"
            >
              <span class="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-2xl">👎</span>
              <span class="mt-3 block text-base font-extrabold text-stone-900">Tidak sesuai</span>
              <span class="mt-1 block text-sm leading-relaxed text-stone-500">
                Isi tidak layak, basi, atau tidak sesuai deskripsi.
              </span>
            </button>
          </div>
        </section>

        <section class="card p-5 sm:p-6">
          <div class="flex items-center justify-between gap-3">
            <label for="feedback-comment" class="text-sm font-bold text-stone-900">
              Cerita singkat <span class="font-normal text-stone-400">(opsional)</span>
            </label>
            <span class="text-[11px] tabular-nums text-stone-400">{{ comment.length }}/1000</span>
          </div>
          <textarea
            id="feedback-comment"
            v-model="comment"
            rows="4"
            maxlength="1000"
            class="input mt-3 resize-none"
            placeholder="Contoh: rotinya masih fresh, tapi porsinya lebih kecil dari tier besar."
          />
          <p class="mt-2 text-xs leading-relaxed text-stone-400">
            Jika toko mengumpulkan lebih dari 20% ulasan “Tidak sesuai”, toko akan masuk daftar peringatan admin.
          </p>
        </section>

        <div
          v-if="submitError"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
        >
          {{ submitError }}
        </div>

        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-stone-400">Ulasan dikirim sekali dan tidak bisa diubah.</p>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!canSubmit"
          >
            <span
              v-if="submitting"
              class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
              aria-hidden="true"
            />
            {{ submitting ? 'Mengirim ulasan...' : 'Kirim ulasan' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>
