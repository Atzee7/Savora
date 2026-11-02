import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi.'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET minimal 16 karakter.'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Environment tidak valid:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
