<script setup lang="ts">
import L from 'leaflet'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Store } from '@/types'
import { formatDistance, haversineKm } from '@/utils/distance'
import { formatTimeRange } from '@/utils/format'

type MapStore = Pick<Store, 'id' | 'storeName' | 'address' | 'latitude' | 'longitude'> &
  Partial<Pick<Store, 'totalStock' | 'schedules'>>

interface MapUserLocation {
  latitude: number
  longitude: number
  accuracy?: number
}

const props = withDefaults(
  defineProps<{
    stores: MapStore[]
    height?: string
    userLocation?: MapUserLocation | null
    showStoreLink?: boolean
  }>(),
  {
    height: '20rem',
    userLocation: null,
    showStoreLink: false,
  },
)

const emit = defineEmits<{ 'open-store': [id: string] }>()

const mapElement = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null

const defaultCenter: L.LatLngExpression = [-7.9666, 112.6326]

const htmlEntities: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => htmlEntities[character] ?? character)
}

function storePopupHtml(store: MapStore, distanceText: string): string {
  const schedule = store.schedules?.[0]
  const meta = [
    typeof store.totalStock === 'number' ? `${store.totalStock} kantong` : '',
    schedule ? `Ambil ${formatTimeRange(schedule.pickupStart, schedule.pickupEnd)}` : '',
  ].filter(Boolean)

  const lines = [
    `<p class="text-sm font-extrabold leading-snug text-ink-950">${escapeHtml(store.storeName)}</p>`,
    `<p class="mt-1 text-[11px] leading-snug text-ink-600">${escapeHtml(store.address)}</p>`,
  ]

  if (meta.length > 0) {
    lines.push(
      `<p class="mt-1.5 text-[11px] font-bold text-brand-700">${escapeHtml(meta.join(' · '))}</p>`,
    )
  }

  if (distanceText) {
    lines.push(`<p class="mt-1 text-[11px] font-semibold text-ink-500">${distanceText}</p>`)
  }

  if (props.showStoreLink) {
    lines.push(
      `<a href="/stores/${encodeURIComponent(store.id)}" data-store-open="${escapeHtml(
        store.id,
      )}" class="mt-2.5 flex min-h-9 items-center justify-center gap-1 rounded-full bg-ink-900 px-3 py-2 text-[11px] font-bold !text-white no-underline transition hover:bg-ink-800">Buka toko <span aria-hidden="true">→</span></a>`,
    )
  }

  return `<div class="min-w-[10rem]">${lines.join('')}</div>`
}

function drawMarkers(): void {
  if (!map || !markerLayer) {
    return
  }

  markerLayer.clearLayers()

  const user = props.userLocation
  const bounds = L.latLngBounds([])

  if (user) {
    if (user.accuracy && user.accuracy > 0) {
      L.circle([user.latitude, user.longitude], {
        radius: Math.min(user.accuracy, 5000),
        color: '#1d4ed8',
        weight: 1,
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
      }).addTo(markerLayer)
    }

    L.circleMarker([user.latitude, user.longitude], {
      radius: 8,
      color: '#1e3a8a',
      weight: 3,
      fillColor: '#3b82f6',
      fillOpacity: 1,
    })
      .bindPopup('Lokasi kamu')
      .addTo(markerLayer)

    bounds.extend([user.latitude, user.longitude])
  }

  for (const store of props.stores) {
    const latLng: L.LatLngExpression = [store.latitude, store.longitude]
    const distanceText = user
      ? `${formatDistance(
          haversineKm(user.latitude, user.longitude, store.latitude, store.longitude),
        )} dari kamu`
      : ''
    const popupHtml = storePopupHtml(store, distanceText)

    // Area sentuh lebih lebar agar marker mudah ditekan di layar HP.
    L.circleMarker(latLng, {
      radius: 20,
      stroke: false,
      fillColor: '#000000',
      fillOpacity: 0,
    })
      .bindPopup(popupHtml, { offset: [0, -6] })
      .addTo(markerLayer)

    L.circleMarker(latLng, {
      radius: 9,
      color: '#047857',
      weight: 3,
      fillColor: '#34d399',
      fillOpacity: 0.9,
    })
      .bindPopup(popupHtml, { offset: [0, -6] })
      .addTo(markerLayer)

    bounds.extend(latLng)
  }

  if (props.stores.length === 0) {
    if (user) {
      map.setView([user.latitude, user.longitude], 14)
    } else {
      map.setView(defaultCenter, 13)
    }

    return
  }

  if (props.stores.length === 1 && !user) {
    map.setView(bounds.getCenter(), 15)
    return
  }

  map.fitBounds(bounds.pad(0.25), { maxZoom: 15 })
}

/**
 * Popup Leaflet berupa HTML biasa, jadi link "Buka toko" ditangani lewat
 * event delegation supaya navigasi tetap berjalan tanpa memuat ulang halaman.
 */
function handleMapClick(event: MouseEvent): void {
  const target = event.target

  if (!(target instanceof Element)) {
    return
  }

  const link = target.closest<HTMLAnchorElement>('[data-store-open]')
  const storeId = link?.dataset.storeOpen

  if (!link || !storeId) {
    return
  }

  event.preventDefault()
  emit('open-store', storeId)
}

onMounted(() => {
  if (!mapElement.value) {
    return
  }

  map = L.map(mapElement.value, { scrollWheelZoom: false }).setView(defaultCenter, 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    detectRetina: true,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  mapElement.value.addEventListener('click', handleMapClick)
  drawMarkers()
})

watch([() => props.stores, () => props.userLocation], drawMarkers, { deep: true })

onBeforeUnmount(() => {
  mapElement.value?.removeEventListener('click', handleMapClick)
  map?.remove()
  map = null
  markerLayer = null
})
</script>

<template>
  <div ref="mapElement" class="relative z-0 w-full overflow-hidden rounded-3xl" :style="{ height }" />
</template>
