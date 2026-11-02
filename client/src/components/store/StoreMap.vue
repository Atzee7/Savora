<script setup lang="ts">
import L from 'leaflet'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { Store } from '@/types'

type MapStore = Pick<Store, 'id' | 'storeName' | 'address' | 'latitude' | 'longitude'>

const props = withDefaults(defineProps<{ stores: MapStore[]; height?: string }>(), {
  height: '20rem',
})

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

function drawMarkers(): void {
  if (!map || !markerLayer) {
    return
  }

  markerLayer.clearLayers()

  if (props.stores.length === 0) {
    map.setView(defaultCenter, 13)
    return
  }

  const bounds = L.latLngBounds([])

  for (const store of props.stores) {
    L.circleMarker([store.latitude, store.longitude], {
      radius: 9,
      color: '#047857',
      weight: 3,
      fillColor: '#34d399',
      fillOpacity: 0.9,
    })
      .bindPopup(
        `<strong>${escapeHtml(store.storeName)}</strong><br />${escapeHtml(store.address)}`,
      )
      .addTo(markerLayer)

    bounds.extend([store.latitude, store.longitude])
  }

  if (props.stores.length === 1) {
    map.setView(bounds.getCenter(), 15)
  } else {
    map.fitBounds(bounds.pad(0.25), { maxZoom: 15 })
  }
}

onMounted(() => {
  if (!mapElement.value) {
    return
  }

  map = L.map(mapElement.value, { scrollWheelZoom: false }).setView(defaultCenter, 13)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  }).addTo(map)

  markerLayer = L.layerGroup().addTo(map)
  drawMarkers()
})

watch(() => props.stores, drawMarkers, { deep: true })

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
})
</script>

<template>
  <div ref="mapElement" class="relative z-0 w-full overflow-hidden rounded-3xl" :style="{ height }" />
</template>
