import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../errors/httpError.js'
import { logger } from '../config/logger.js'

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: { code: error.code, message: error.message, details: error.details },
    })
    return
  }

  logger.error({ error }, 'Unhandled request error')
  response.status(500).json({
    error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' },
  })
}
