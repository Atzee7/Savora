import type { Role } from '@prisma/client'
import jwt, { type SignOptions } from 'jsonwebtoken'

import { env } from '../config/env.js'

export type AuthTokenPayload = {
  sub: string
  role: Role
  email: string
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(
    { role: payload.role, email: payload.email },
    env.JWT_SECRET,
    {
      subject: payload.sub,
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    },
  )
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET)

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.role !== 'string' ||
    typeof decoded.email !== 'string'
  ) {
    throw new Error('Payload token tidak valid.')
  }

  return {
    sub: decoded.sub,
    role: decoded.role as Role,
    email: decoded.email,
  }
}
