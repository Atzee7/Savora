export type Role = 'CUSTOMER' | 'MERCHANT' | 'ADMIN'

export type StoreStatus = 'PENDING' | 'ACTIVE' | 'WARNING' | 'SUSPENDED'

export type TierName = 'HEMAT' | 'REGULER' | 'BESAR'

export type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  phone: string | null
  createdAt: string
}

export interface Tier {
  id: string
  name: TierName
  price: number
  minOriginalValue: number
  stock: number
}

export interface StoreSchedule {
  id: string
  pickupStart: string
  pickupEnd: string
}

export interface Store {
  id: string
  storeName: string
  address: string
  latitude: number
  longitude: number
  status: StoreStatus
  schedules: StoreSchedule[]
  tiers: Tier[]
  totalStock: number
}

export interface Order {
  id: string
  customerId: string
  storeId: string
  tierId: string
  qty: number
  totalPrice: number
  status: OrderStatus
  pinCode: string | null
  expiresAt: string | null
  createdAt: string
}

export interface ApiErrorResponse {
  message: string
  details?: unknown
}
