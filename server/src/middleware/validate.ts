import type { RequestHandler } from 'express'
import { ZodError, type ZodTypeAny } from 'zod'

import { ApiError } from '../utils/apiError.js'

type RequestSchemas = {
  body?: ZodTypeAny
  query?: ZodTypeAny
  params?: ZodTypeAny
}

export function validate(schemas: RequestSchemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body)
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ApiError(422, 'Data permintaan tidak valid.', error.flatten().fieldErrors))
        return
      }
      next(error)
    }
  }
}
