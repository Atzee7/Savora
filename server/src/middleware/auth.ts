import type { RequestHandler } from 'express'

import { ApiError } from '../utils/apiError.js'
import { verifyAuthToken } from '../utils/jwt.js'

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    next(new ApiError(401, 'Token autentikasi tidak ditemukan.'))
    return
  }

  try {
    const payload = verifyAuthToken(header.slice('Bearer '.length))
    req.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    }
    next()
  } catch {
    next(new ApiError(401, 'Token tidak valid atau sudah kedaluwarsa.'))
  }
}
