import { randomInt } from 'node:crypto'

export function generatePin(): string {
  return randomInt(0, 10_000).toString().padStart(4, '0')
}
