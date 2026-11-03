export type MapsCoords = {
  latitude: number
  longitude: number
}

const COORD = String.raw`-?\d{1,3}(?:\.\d+)?`

const EXACT_PLACE = new RegExp(`!3d(${COORD})!4d(${COORD})`)
const VIEWPORT = new RegExp(`@(${COORD}),(${COORD})`)
const BARE_PAIR = new RegExp(`^\\s*\\(?\\s*(${COORD})\\s*,\\s*(${COORD})\\s*\\)?\\s*$`)
const PARAM_PAIR = new RegExp(`^(?:loc:)?\\s*(${COORD})\\s*,\\s*(${COORD})`)

function toCoords(latitudeText: string, longitudeText: string): MapsCoords | null {
  const latitude = Number(latitudeText)
  const longitude = Number(longitudeText)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null
  }

  return { latitude, longitude }
}

function matchPair(value: string, pattern: RegExp): MapsCoords | null {
  const match = value.match(pattern)

  if (!match) {
    return null
  }

  return toCoords(match[1] ?? '', match[2] ?? '')
}

export function isShortMapsLink(value: string): boolean {
  return /(?:maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i.test(value)
}

/**
 * Mengambil koordinat dari tautan Google Maps.
 *
 * Prioritas: koordinat tempat (`!3d...!4d...`), titik tengah peta (`@lat,lng`),
 * parameter query (`q`, `query`, `ll`, `center`, `destination`), lalu teks
 * "lat, lng" yang ditempel langsung.
 */
export function parseMapsLink(rawValue: string): MapsCoords | null {
  const value = rawValue.trim()

  if (!value) {
    return null
  }

  let decoded = value

  try {
    decoded = decodeURIComponent(value)
  } catch {
    decoded = value
  }

  const place = matchPair(decoded, EXACT_PLACE)

  if (place) {
    return place
  }

  const viewport = matchPair(decoded, VIEWPORT)

  if (viewport) {
    return viewport
  }

  try {
    const url = new URL(decoded)

    for (const key of ['q', 'query', 'll', 'center', 'destination']) {
      const param = url.searchParams.get(key)
      const coords = param ? matchPair(param, PARAM_PAIR) : null

      if (coords) {
        return coords
      }
    }
  } catch {
    // Bukan URL utuh, lanjut ke pencocokan teks biasa.
  }

  return matchPair(decoded, BARE_PAIR)
}

export function formatCoord(value: number): string {
  return String(Number(value.toFixed(7)))
}
