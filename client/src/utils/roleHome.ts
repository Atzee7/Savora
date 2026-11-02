import type { Role } from '@/types'

export function homePathForRole(role: Role | null | undefined): string {
  if (role === 'ADMIN') {
    return '/admin'
  }

  if (role === 'MERCHANT') {
    return '/merchant'
  }

  return '/orders'
}
