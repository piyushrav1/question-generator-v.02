import type { NextFunction, Request, Response } from 'express'
import type { ZodSchema } from 'zod'
import { HttpError } from '../errors/httpError.js'

export function validateBody(schema: ZodSchema) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw new HttpError(400, 'Request validation failed.', 'VALIDATION_ERROR', result.error.flatten())
    }
    request.body = result.data
    next()
  }
}
