import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { authService, type LoginPayload, type RegisterPayload } from '@/services/auth.service'
import type { User } from '@/types'

const TOKEN_KEY = 'savora.token'
const USER_KEY = 'savora.user'

function readStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(readStoredUser())

  const isAuthenticated = computed(() => Boolean(token.value))
  const role = computed(() => user.value?.role ?? null)

  function persist(): void {
    if (token.value) {
      localStorage.setItem(TOKEN_KEY, token.value)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }

    if (user.value) {
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }

  async function login(payload: LoginPayload): Promise<void> {
    const response = await authService.login(payload)
    token.value = response.token
    user.value = response.user
    persist()
  }

  async function register(payload: RegisterPayload): Promise<void> {
    const response = await authService.register(payload)
    token.value = response.token
    user.value = response.user
    persist()
  }

  async function fetchMe(): Promise<void> {
    if (!token.value) {
      return
    }

    try {
      user.value = await authService.me()
      persist()
    } catch {
      logout()
    }
  }

  function logout(): void {
    token.value = null
    user.value = null
    persist()
  }

  return {
    token,
    user,
    isAuthenticated,
    role,
    login,
    register,
    fetchMe,
    logout,
  }
})
