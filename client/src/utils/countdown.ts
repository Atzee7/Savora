export function remainingMs(expiresAt: string | null, now: number = Date.now()): number {
  if (!expiresAt) {
    return 0
  }

  const target = new Date(expiresAt).getTime()
  return Number.isNaN(target) ? 0 : Math.max(0, target - now)
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((value) => value.toString().padStart(2, '0')).join(':')
}
