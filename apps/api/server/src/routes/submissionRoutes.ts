import { Router } from 'express'
import { z } from 'zod'
import { PROGRAMMING_LANGUAGES } from '../../../../../packages/shared/src/types.js'
import { validateBody } from '../middleware/validateRequest.js'
import { SubmissionService } from '../../../../../services/execution-engine/src/submissionService.js'

const submissionSchema = z.object({
  questionId: z.string().trim().min(1).max(100),
  language: z.enum(PROGRAMMING_LANGUAGES),
  code: z.string().min(20).max(100_000),
  submitted: z.boolean().default(false),
})

export function createSubmissionRouter(service: SubmissionService): Router {
  const router = Router()

  router.post('/', validateBody(submissionSchema), async (request, response, next) => {
    try {
      response.status(201).json(await service.evaluate(request.body))
    } catch (error) {
      next(error)
    }
  })

  return router
}
