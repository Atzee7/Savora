import { onBeforeUnmount, onMounted, ref } from 'vue'

interface AutoRefreshOptions {
  /** Jeda antar pembaruan dalam milidetik. */
  interval?: number
  /** Hentikan sementara pembaruan otomatis, misalnya saat data pertama masih dimuat. */
  enabled?: () => boolean
}

/**
 * Menjaga data halaman tetap segar tanpa reload: interval berkala, saat tab
 * kembali terlihat, dan saat jendela kembali fokus.
 */
export function useAutoRefresh(
  task: () => Promise<unknown> | unknown,
  options: AutoRefreshOptions = {},
) {
  const interval = options.interval ?? 20_000
  const enabled = options.enabled ?? (() => true)

  const lastUpdated = ref<Date | null>(null)
  const refreshing = ref(false)

  let timer: ReturnType<typeof setInterval> | null = null
  let running = false

  async function refresh(): Promise<void> {
    if (running || !enabled()) {
      return
    }

    running = true
    refreshing.value = true

    try {
      await task()
      lastUpdated.value = new Date()
    } catch {
      // Data terakhir tetap tampil; percobaan berikutnya akan mencoba lagi.
    } finally {
      running = false
      refreshing.value = false
    }
  }

  function refreshWhenVisible(): void {
    if (document.visibilityState === 'visible') {
      void refresh()
    }
  }

  onMounted(() => {
    timer = setInterval(refreshWhenVisible, interval)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('focus', refreshWhenVisible)
  })

  onBeforeUnmount(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }

    document.removeEventListener('visibilitychange', refreshWhenVisible)
    window.removeEventListener('focus', refreshWhenVisible)
  })

  return { lastUpdated, refreshing, refresh }
}
