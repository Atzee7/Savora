import type { User } from '@prisma/client'
import { Router } from 'express'
import { z } from 'zod'

import { prisma } from '../../config/prisma.js'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { ApiError } from '../../utils/apiError.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { signAuthToken } from '../../utils/jwt.js'
import { hashPassword, verifyPassword } from '../../utils/password.js'

const router = Router()

function serializeUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt,
  }
}

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Format email tidak valid.')
  .max(160, 'Email maksimal 160 karakter.')

const passwordSchema = z
  .string()
  .min(8, 'Password minimal 8 karakter.')
  .max(72, 'Password maksimal 72 karakter.')

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter.')
    .max(120, 'Nama maksimal 120 karakter.'),
  email: emailSchema,
  password: passwordSchema,
  phone: z
    .string()
    .trim()
    .max(30, 'Nomor telepon maksimal 30 karakter.')
    .regex(/^[0-9+\-\s()]*$/, 'Nomor telepon hanya boleh berisi angka, spasi, dan tanda + - ( ).')
    .optional()
    .transform((value) => value || null),
}).strict()

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password wajib diisi.'),
})

router.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body as z.infer<typeof registerSchema>

    const existingUser = await prisma.user.findUnique({ where: { email } })

    if (existingUser) {
      throw new ApiError(409, 'Email sudah terdaftar. Silakan masuk.')
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: 'CUSTOMER',
      },
    })

    const token = signAuthToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    })

    res.status(201).json({ token, user: serializeUser(user) })
  }),
)

router.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      throw new ApiError(401, 'Email atau password salah.')
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash)

    if (!passwordMatches) {
      throw new ApiError(401, 'Email atau password salah.')
    }

    const token = signAuthToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    })

    res.json({ token, user: serializeUser(user) })
  }),
)

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
    })

    if (!user) {
      throw new ApiError(401, 'Sesi tidak valid. Silakan masuk kembali.')
    }

    res.json(serializeUser(user))
  }),
)

export default router
