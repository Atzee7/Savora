<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppButton from '@/components/common/AppButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PageHero from '@/components/common/PageHero.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { orderService } from '@/services/order.service'
import type { Order, TierName } from '@/types'
import { getErrorMessage } from '@/utils/error'
import { formatDate, formatRupiah } from '@/utils/format'
import { storeImage } from '@/utils/storeImage'

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
      class="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 transition hover:text-ink-950"
    >
      <span aria-hidden="true">←</span> Kembali ke pesanan
    </RouterLink>

    <div v-if="loading" class="mt-6 space-y-5">
      <div class="h-52 animate-pulse rounded-[2rem] bg-sage-200" />
      <div class="h-72 animate-pulse rounded-[2rem] bg-sage-200" />
    </div>

    <div v-else-if="loadError || !order" class="mt-6">
      <EmptyState title="Pesanan tidak ditemukan" :description="loadError">
        <template #icon>⚠️</template>
        <template #action>
          <RouterLink
            to="/orders"
            class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
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
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              Buka tiket
            </RouterLink>
            <RouterLink
              to="/orders"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-sage-100"
            >
              Kembali ke pesanan
            </RouterLink>
          </div>
        </template>
      </EmptyState>
    </div>

    <template v-else>
      <div class="mt-6">
        <PageHero
          :image="storeImage(order.store.storeName)"
          eyebrow="Ulasan pesanan"
          :title="order.feedback ? 'Ulasan sudah terkirim' : 'Bagaimana isi kantongmu?'"
          description="Ulasan singkat membantu Savora menjaga kualitas mitra di Malang."
        >
          <template #badges>
            <StatusBadge :status="order.status" />
            <span
              class="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
            >
              Order {{ order.id.slice(0, 8).toUpperCase() }}
            </span>
          </template>

          <template #meta>
            <span>{{ order.store.storeName }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>{{ tierLabels[order.tier.name] }} × {{ order.qty }}</span>
            <span class="text-white/30" aria-hidden="true">·</span>
            <span>{{ formatRupiah(order.totalPrice) }}</span>
          </template>
        </PageHero>
      </div>

      <section
        v-if="order.feedback"
        v-reveal
        class="mt-6 rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card sm:p-8"
      >
        <div class="flex flex-col items-center text-center">
          <span
            class="grid h-16 w-16 place-items-center rounded-2xl text-3xl"
            :class="order.feedback.isSatisfied ? 'bg-brand-100' : 'bg-red-50'"
          >
            {{ order.feedback.isSatisfied ? '👍' : '👎' }}
          </span>
          <p class="mt-4 text-lg font-extrabold tracking-tight text-ink-950">
            {{
              order.feedback.isSatisfied
                ? 'Kamu menilai isi kantong sesuai'
                : 'Kamu menilai isi kantong tidak sesuai'
            }}
          </p>
          <p class="mt-1 max-w-md text-sm leading-relaxed text-ink-600">
            Terima kasih, ulasan ini membantu Savora menjaga kualitas mitra. Ulasan tidak dapat
            diubah setelah dikirim.
          </p>

          <blockquote
            v-if="order.feedback.comment"
            class="mt-5 w-full rounded-2xl border border-ink-900/10 bg-sage-100 px-5 py-4 text-left text-sm leading-relaxed text-ink-700"
          >
            “{{ order.feedback.comment }}”
          </blockquote>

          <p class="mt-4 text-xs text-ink-500">Dikirim {{ formatDate(order.feedback.createdAt) }}</p>

          <div class="mt-6 flex flex-col gap-2 sm:flex-row">
            <RouterLink
              to="/orders"
              class="inline-flex min-h-11 items-center justify-center rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800"
            >
              Lihat pesanan saya
            </RouterLink>
            <RouterLink
              to="/catalog"
              class="inline-flex min-h-11 items-center justify-center rounded-full border border-ink-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink-800 transition hover:bg-sage-100"
            >
              Cari Surprise Bag
            </RouterLink>
          </div>
        </div>
      </section>

      <form v-else v-reveal class="mt-6 space-y-5" @submit.prevent="submit">
        <section class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-700">
                Pertanyaan singkat
              </p>
              <h2 class="mt-2 text-lg font-extrabold tracking-tight text-ink-950">
                Apakah isi Surprise Bag sesuai dengan ekspektasi tier kamu?
              </h2>
            </div>
            <span class="rounded-full bg-sage-200 px-3 py-1 text-[11px] font-bold text-ink-600">
              Wajib dipilih
            </span>
          </div>

          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-2xl border-2 p-5 text-left transition"
              :class="
                selected === true
                  ? 'border-brand-700 bg-brand-50 ring-4 ring-brand-100'
                  : 'border-ink-900/10 bg-white hover:border-ink-900/30 hover:bg-sage-50'
              "
              :aria-pressed="selected === true"
              @click="selected = true"
            >
              <span
                class="grid h-12 w-12 place-items-center rounded-xl"
                :class="selected === true ? 'bg-brand-100 text-brand-700' : 'bg-sage-100 text-ink-600'"
              >
                <svg
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="m5 13 4 4 10-10" />
                </svg>
              </span>
              <span class="mt-3 block text-base font-extrabold text-ink-950">Sesuai</span>
              <span class="mt-1 block text-sm leading-relaxed text-ink-600">
                Isi layak, porsi sesuai tier, dan memuaskan.
              </span>
            </button>

            <button
              type="button"
              class="rounded-2xl border-2 p-5 text-left transition"
              :class="
                selected === false
                  ? 'border-red-300 bg-red-50 ring-4 ring-red-100'
                  : 'border-ink-900/10 bg-white hover:border-ink-900/30 hover:bg-sage-50'
              "
              :aria-pressed="selected === false"
              @click="selected = false"
            >
              <span
                class="grid h-12 w-12 place-items-center rounded-xl"
                :class="selected === false ? 'bg-red-100 text-red-600' : 'bg-sage-100 text-ink-600'"
              >
                <svg
                  class="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </span>
              <span class="mt-3 block text-base font-extrabold text-ink-950">Tidak sesuai</span>
              <span class="mt-1 block text-sm leading-relaxed text-ink-600">
                Isi tidak layak, basi, atau tidak sesuai deskripsi.
              </span>
            </button>
          </div>
        </section>

        <section class="rounded-[2rem] border border-ink-900/10 bg-white p-6 shadow-card sm:p-8">
          <div class="flex items-center justify-between gap-3">
            <label for="feedback-comment" class="text-sm font-bold text-ink-950">
              Cerita singkat <span class="font-normal text-ink-500">(opsional)</span>
            </label>
            <span class="text-[11px] tabular-nums text-ink-500">{{ comment.length }}/1000</span>
          </div>
          <textarea
            id="feedback-comment"
            v-model="comment"
            rows="4"
            maxlength="1000"
            class="input mt-3 resize-none"
            placeholder="Contoh: rotinya masih fresh, tapi porsinya lebih kecil dari tier besar."
          />
          <p class="mt-2 text-xs leading-relaxed text-ink-500">
            Jika toko mengumpulkan lebih dari 20% ulasan “Tidak sesuai”, toko akan masuk daftar
            peringatan admin.
          </p>
        </section>

        <div
          v-if="submitError"
          class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700"
          role="alert"
        >
          {{ submitError }}
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p class="text-xs text-ink-500">Ulasan dikirim sekali dan tidak bisa diubah.</p>
          <AppButton
            type="submit"
            variant="ink"
            size="lg"
            :loading="submitting"
            :disabled="!canSubmit"
          >
            {{ submitting ? 'Mengirim ulasan...' : 'Kirim ulasan' }}
          </AppButton>
        </div>
      </form>
    </template>
  </div>
</template>
