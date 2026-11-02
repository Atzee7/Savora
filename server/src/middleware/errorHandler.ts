import { Prisma } from '@prisma/client'
import type { ErrorRequestHandler, RequestHandler } from 'express'

import { env } from '../config/env.js'
import { ApiError } from '../utils/apiError.js'

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new ApiError(404, `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`))
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    })
    return
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      res.status(409).json({ message: 'Data tersebut sudah digunakan.' })
      return
    }
    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Data tidak ditemukan.' })
      return
    }
  }

  console.error('[error]', error)
  res.status(500).json({
    message: 'Terjadi kesalahan pada server.',
    ...(env.NODE_ENV === 'development'
      ? { detail: error instanceof Error ? error.message : String(error) }
      : {}),
  })
}
