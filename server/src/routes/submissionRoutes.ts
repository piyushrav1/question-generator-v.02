import { Router } from 'express'
import { z } from 'zod'
import { PROGRAMMING_LANGUAGES } from '../../../shared/types.js'
import { validateBody } from '../middleware/validateRequest.js'
import { SubmissionService } from '../services/submissionService.js'

const submissionSchema = z.object({
  questionId: z.string().trim().min(1).max(100),
  language: z.enum(PROGRAMMING_LANGUAGES),
  code: z.string().min(20).max(100_000),
  submitted: z.boolean().default(false),
})

export function createSubmissionRouter(service: SubmissionService): Router {
  const router = Router()

  router.post('/', validateBody(submissionSchema), (request, response) => {
    response.status(201).json(service.evaluate(request.body))
  })

  return router
}
