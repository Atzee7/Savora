import axios from 'axios'

import type { ApiErrorResponse } from '@/types'

export function getErrorMessage(error: unknown, fallback = 'Terjadi kesalahan. Silakan coba lagi.'): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
