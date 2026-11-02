import type { Role } from '@prisma/client'
import type { RequestHandler } from 'express'

import { ApiError } from '../utils/apiError.js'

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) {
      next(new ApiError(401, 'Autentikasi diperlukan.'))
      return
    }

    if (!roles.includes(req.auth.role)) {
      next(new ApiError(403, 'Anda tidak memiliki akses ke resource ini.'))
      return
    }

    next()
  }
}
