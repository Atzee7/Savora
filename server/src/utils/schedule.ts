import type { StoreSchedule } from '@prisma/client'
import { DateTime } from 'luxon'

import { APP_TIME_ZONE, dbTimeToString, nowInAppZone, pickupWindowHasPassed } from './time.js'

type ScheduleShape = Pick<StoreSchedule, 'dayOfWeek' | 'pickupStart' | 'pickupEnd'>

/** Jadwal berlaku harian (dayOfWeek null) atau pada hari yang sama dengan referensi. */
export function scheduleMatchesDay(
  schedule: Pick<StoreSchedule, 'dayOfWeek'>,
  reference: DateTime = nowInAppZone(),
): boolean {
  return schedule.dayOfWeek === null || schedule.dayOfWeek === reference.weekday
}

/** Jadwal hari ini yang belum melewati jam pickup_end. */
export function upcomingScheduleToday<T extends ScheduleShape>(
  schedules: T[],
  reference: DateTime = nowInAppZone(),
): T | null {
  return (
    schedules
      .filter((schedule) => scheduleMatchesDay(schedule, reference))
      .filter((schedule) => !pickupWindowHasPassed(schedule.pickupEnd, reference))
      .sort((a, b) => a.pickupStart.getTime() - b.pickupStart.getTime())[0] ?? null
  )
}

/** Jadwal hari ini tanpa memedulikan apakah jam pickup sudah lewat (untuk riwayat tiket). */
export function scheduleToday<T extends ScheduleShape>(
  schedules: T[],
  reference: DateTime = nowInAppZone(),
): T | null {
  return (
    schedules
      .filter((schedule) => scheduleMatchesDay(schedule, reference))
      .sort((a, b) => a.pickupStart.getTime() - b.pickupStart.getTime())[0] ?? null
  )
}

/** Konversi kolom TIME menjadi DateTime pada tanggal referensi di zona Asia/Jakarta. */
export function dateTimeAtTime(value: Date, reference: DateTime): DateTime {
  const [hour, minute] = dbTimeToString(value).split(':').map(Number)

  return reference
    .setZone(APP_TIME_ZONE)
    .set({ hour: hour ?? 0, minute: minute ?? 0, second: 0, millisecond: 0 })
}
