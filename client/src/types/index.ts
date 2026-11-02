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

export interface OrderStore {
  id: string
  storeName: string
  address: string
  latitude: number
  longitude: number
}

export interface OrderTier {
  id: string
  name: TierName
  price: number
  minOriginalValue: number
}

export interface OrderSchedule {
  pickupStart: string
  pickupEnd: string
}

export interface OrderFeedback {
  isSatisfied: boolean
  comment: string | null
  createdAt: string
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
  updatedAt: string
  store: OrderStore
  tier: OrderTier
  schedule: OrderSchedule | null
  feedback: OrderFeedback | null
}

export interface FeedbackPayload {
  isSatisfied: boolean
  comment?: string
}

export interface CheckoutInfo {
  tier: Tier
  store: OrderStore
  schedule: OrderSchedule
  maxQty: number
  remainingQty: number
}

export interface CreateOrderPayload {
  tierId: string
  qty: number
}

export interface MerchantRecentOrder {
  id: string
  customerName: string
  tierName: TierName
  qty: number
  totalPrice: number
  status: OrderStatus
  expiresAt: string | null
  createdAt: string
}

export interface MerchantSummary {
  revenueToday: number
  completedToday: number
  bagsToday: number
  activePickups: number
  totalStock: number
  recentOrders: MerchantRecentOrder[]
}

export interface PinVerificationResult {
  orderId: string
  customerName: string
  tierName: TierName
  qty: number
  totalPrice: number
  completedAt: string
}

export interface AdminMerchant {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  store: Store | null
}

export interface CreateMerchantPayload {
  ownerName: string
  email: string
  phone?: string
  password: string
  storeName: string
  address: string
  latitude: number
  longitude: number
  pickupStart: string
  pickupEnd: string
}

export interface FeedbackSummary {
  total: number
  unsatisfied: number
  rate: number
}

export interface AdminFlaggedStore {
  id: string
  storeName: string
  address: string
  status: StoreStatus
  ownerName: string
  ownerEmail: string
  totalStock: number
  feedback: FeedbackSummary
}

export interface AdminRecentOrder {
  id: string
  customerName: string
  storeName: string
  tierName: TierName
  qty: number
  totalPrice: number
  status: OrderStatus
  createdAt: string
}

export interface AdminOverviewStats {
  totalMerchants: number
  totalCustomers: number
  totalStores: number
  activeStores: number
  warningStores: number
  suspendedStores: number
  totalStock: number
  ordersToday: number
  completedToday: number
  revenueToday: number
  feedbackTotal: number
  unsatisfiedCount: number
  unsatisfiedRate: number
}

export interface AdminOverview {
  stats: AdminOverviewStats
  flaggedStores: AdminFlaggedStore[]
  recentOrders: AdminRecentOrder[]
}

export interface ApiErrorResponse {
  message: string
  details?: unknown
}
