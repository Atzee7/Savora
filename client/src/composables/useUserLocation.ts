import { ref } from 'vue'

export interface UserLocation {
  latitude: number
  longitude: number
  /** Akurasi dalam meter. */
  accuracy: number
  at: Date
}

export type UserLocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'error'

/**
 * Lokasi user hanya dipakai di browser. Koordinat tidak pernah dikirim ke server,
 * jadi tidak perlu API key dan tidak ada data lokasi yang tersimpan.
 */
export function useUserLocation() {
  const location = ref<UserLocation | null>(null)
  const status = ref<UserLocationStatus>('idle')
  const error = ref('')

  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  function request(): Promise<void> {
    if (!supported) {
      status.value = 'unavailable'
      error.value = 'Perangkat ini tidak mendukung deteksi lokasi.'
      return Promise.resolve()
    }

    status.value = 'requesting'
    error.value = ''

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          location.value = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            at: new Date(),
          }
          status.value = 'granted'
          resolve()
        },
        (geoError) => {
          if (geoError.code === geoError.PERMISSION_DENIED) {
            status.value = 'denied'
            error.value =
              'Izin lokasi ditolak. Aktifkan lewat ikon gembok di address bar, lalu coba lagi.'
          } else {
            status.value = 'error'
            error.value = 'Lokasi belum bisa dideteksi. Coba lagi.'
          }

          resolve()
        },
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
      )
    })
  }

  function clear(): void {
    location.value = null
    status.value = 'idle'
    error.value = ''
  }

  return { location, status, error, supported, request, clear }
}
