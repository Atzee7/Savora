<script setup lang="ts">
defineProps<{
  image: string
  imageAlt: string
  statement: string
  description: string
  facts: { label: string; value: string }[]
  passLabel: string
  heading: string
  intro: string
}>()
</script>

<template>
  <section class="relative isolate overflow-hidden bg-ink-950">
    <div class="grid lg:min-h-[calc(100vh-4.5rem)] lg:grid-cols-2">
      <div
        class="relative isolate flex min-h-[18rem] flex-col justify-between overflow-hidden p-6 sm:min-h-[21rem] sm:p-9 lg:min-h-0 lg:p-14"
      >
        <img
          :src="image"
          :alt="imageAlt"
          width="900"
          height="700"
          fetchpriority="high"
          class="absolute inset-0 -z-10 h-full w-full object-cover object-center"
        />
        <div
          class="absolute inset-0 -z-10 bg-gradient-to-b from-ink-950/85 via-ink-950/45 to-ink-950/95"
          aria-hidden="true"
        />

        <div class="flex items-start justify-between gap-4">
          <RouterLink
            to="/"
            class="text-lg font-extrabold tracking-tight text-white transition hover:text-brand-200"
          >
            Savora
          </RouterLink>
          <span
            class="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-sage-200"
          >
            Malang, ID
          </span>
        </div>

        <div class="mt-12 lg:mt-0">
          <p
            class="max-w-md text-[clamp(1.65rem,3.4vw,2.6rem)] font-extrabold leading-[1.08] tracking-tight text-white"
          >
            {{ statement }}
          </p>
          <p class="mt-4 hidden max-w-md text-sm leading-relaxed text-sage-100 sm:block">
            {{ description }}
          </p>

          <dl
            class="mt-7 hidden gap-x-6 gap-y-4 border-t border-white/20 pt-5 sm:grid sm:grid-cols-3"
          >
            <div v-for="fact in facts" :key="fact.label">
              <dt class="font-mono text-[10px] uppercase tracking-[0.16em] text-sage-300">
                {{ fact.label }}
              </dt>
              <dd class="mt-1 text-sm font-bold leading-snug text-white">{{ fact.value }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-16">
        <div class="w-full max-w-[30rem]">
          <div class="shadow-float">
            <div
              class="relative border-b border-dashed border-ink-900/30 bg-sage-50 px-6 pb-4 pt-5 sm:px-8"
            >
              <div class="flex items-center justify-between gap-4">
                <span class="text-[13px] font-extrabold tracking-tight text-ink-950">Savora</span>
                <span
                  class="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-600"
                >
                  Malang / WIB
                </span>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <span class="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-600">
                  {{ passLabel }}
                </span>
                <span
                  class="h-px flex-1 border-t border-dashed border-ink-900/20"
                  aria-hidden="true"
                />
              </div>

              <span
                class="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-ink-950"
                aria-hidden="true"
              />
              <span
                class="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-ink-950"
                aria-hidden="true"
              />
            </div>

            <div class="bg-sage-50 px-6 pb-7 pt-6 sm:px-8 sm:pb-8 sm:pt-7">
              <h1 class="text-[1.7rem] font-extrabold leading-[1.1] tracking-tight text-ink-950 sm:text-3xl">
                {{ heading }}
              </h1>
              <p class="mt-2.5 max-w-sm text-sm leading-relaxed text-ink-600">{{ intro }}</p>

              <slot />
            </div>
          </div>

          <div class="mt-5 text-center">
            <slot name="switch" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
