const EARTH_RADIUS_KM = 6371

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180

/** Jarak garis lurus antara dua koordinat dalam kilometer. */
export function haversineKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number,
): number {
  const deltaLatitude = toRadians(toLatitude - fromLatitude)
  const deltaLongitude = toRadians(toLongitude - fromLongitude)

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(fromLatitude)) *
      Math.cos(toRadians(toLatitude)) *
      Math.sin(deltaLongitude / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

const distanceFormatter = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })

/** Jarak ramah dibaca: `850 m`, `1,2 km`, `12 km`. */
export function formatDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) {
    return '—'
  }

  const meters = Math.round((km * 1000) / 10) * 10

  if (meters < 1000) {
    return `${Math.max(10, meters)} m`
  }

  const rounded = km < 10 ? Number(km.toFixed(1)) : Math.round(km)

  return `${distanceFormatter.format(rounded)} km`
}
