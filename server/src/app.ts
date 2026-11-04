import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { pinoHttp } from 'pino-http'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFoundHandler.js'
import { QuestionRepository } from './repositories/questionRepository.js'
import { createQuestionRouter } from './routes/questionRoutes.js'
import { healthRouter } from './routes/healthRoutes.js'
import { createSubmissionRouter } from './routes/submissionRoutes.js'
import { QuestionService } from './services/questionService.js'
import { SubmissionService } from './services/submissionService.js'

export function createApp() {
  const app = express()
  const repository = new QuestionRepository()
  const questionService = new QuestionService(repository)
  const submissionService = new SubmissionService(repository)

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(cors({ origin: env.CLIENT_ORIGIN }))
  app.use(express.json({ limit: '1mb' }))
  app.use(pinoHttp({ logger }))

  app.use('/api/health', healthRouter)
  app.use('/api/questions', createQuestionRouter(questionService))
  app.use('/api/submissions', createSubmissionRouter(submissionService))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
