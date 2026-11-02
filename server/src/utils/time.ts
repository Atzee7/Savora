import { DateTime } from 'luxon'

export const APP_TIME_ZONE = 'Asia/Jakarta'

/** Prisma menyimpan TIME sebagai Date 1970-01-01; ambil jamnya tanpa konversi zona. */
export function dbTimeToString(value: Date): string {
  return value.toISOString().slice(11, 16)
}

/** Mengubah "HH:mm" menjadi Date 1970-01-01 UTC agar cocok dengan kolom TIME Prisma. */
export function timeStringToDbDate(value: string): Date {
  const [hour, minute] = value.split(':').map(Number)
  return new Date(Date.UTC(1970, 0, 1, hour ?? 0, minute ?? 0))
}

export function nowInAppZone(): DateTime {
  return DateTime.now().setZone(APP_TIME_ZONE)
}

/** True jika jam pickup_end hari ini sudah terlewati pada zona waktu aplikasi. */
export function pickupWindowHasPassed(pickupEnd: Date, reference: DateTime = nowInAppZone()): boolean {
  const [hour, minute] = dbTimeToString(pickupEnd).split(':').map(Number)

  if (hour === undefined || minute === undefined) {
    return false
  }

  const end = reference.set({ hour, minute, second: 0, millisecond: 0 })
  return reference > end
}
