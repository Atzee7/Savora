import { TierName } from '@prisma/client'

export const DEFAULT_TIERS: Array<{
  name: TierName
  price: number
  minOriginalValue: number
}> = [
  { name: TierName.HEMAT, price: 15_000, minOriginalValue: 45_000 },
  { name: TierName.REGULER, price: 25_000, minOriginalValue: 75_000 },
  { name: TierName.BESAR, price: 35_000, minOriginalValue: 105_000 },
]
