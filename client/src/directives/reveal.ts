import type { Directive } from 'vue'

type RevealValue = { delay?: number } | number | undefined

const MAX_DELAY = 400
const DURATION = 520
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

let observer: IntersectionObserver | null = null
const timers = new WeakMap<HTMLElement, number>()

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION).matches
}

function canReveal(): boolean {
  return typeof IntersectionObserver !== 'undefined' && !prefersReducedMotion()
}

function resolveDelay(value: RevealValue): number {
  const raw = typeof value === 'number' ? value : (value?.delay ?? 0)
  return Math.min(Math.max(raw, 0), MAX_DELAY)
}

/** Lepas class animasi agar hover/transisi bawaan elemen kembali normal. */
function settle(element: HTMLElement): void {
  const timer = timers.get(element)

  if (timer) {
    window.clearTimeout(timer)
    timers.delete(element)
  }

  element.classList.remove('reveal', 'is-visible')
  element.style.removeProperty('--reveal-delay')
}

function revealNow(element: HTMLElement): void {
  element.classList.add('is-visible')

  const delay = Number.parseInt(element.style.getPropertyValue('--reveal-delay'), 10) || 0
  const fallback = window.setTimeout(() => settle(element), delay + DURATION + 200)
  timers.set(element, fallback)

  element.addEventListener(
    'transitionend',
    (event) => {
      if (event.target === element && event.propertyName === 'opacity') {
        settle(element)
      }
    },
    { once: true },
  )
}

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue
          }

          const element = entry.target as HTMLElement
          observer?.unobserve(element)
          revealNow(element)
        }
      },
      {
        // Mulai sedikit sebelum elemen menyentuh tepi bawah layar.
        rootMargin: '0px 0px -10% 0px',
        threshold: 0,
      },
    )
  }

  return observer
}

/**
 * Menampilkan elemen perlahan saat masuk viewport.
 * Tanpa class `reveal`, elemen tetap terlihat, jadi aman bila JS gagal.
 */
export const reveal: Directive<HTMLElement, RevealValue> = {
  beforeMount(element, binding) {
    if (!canReveal()) {
      return
    }

    element.style.setProperty('--reveal-delay', `${resolveDelay(binding.value)}ms`)
    element.classList.add('reveal')
  },

  mounted(element) {
    if (!element.classList.contains('reveal')) {
      return
    }

    getObserver().observe(element)
  },

  unmounted(element) {
    observer?.unobserve(element)

    const timer = timers.get(element)

    if (timer) {
      window.clearTimeout(timer)
      timers.delete(element)
    }
  },
}
