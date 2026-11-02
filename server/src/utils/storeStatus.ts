import { StoreStatus } from '@prisma/client'

/** Toko yang masih boleh tampil di katalog dan menerima pesanan. WARNING tetap beroperasi. */
export const OPERATIONAL_STORE_STATUSES: StoreStatus[] = [
  StoreStatus.ACTIVE,
  StoreStatus.WARNING,
]
