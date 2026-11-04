import { Router } from 'express'
import { z } from 'zod'
import { DIFFICULTIES } from '../../../../../packages/shared/src/types.js'
import { validateBody } from '../middleware/validateRequest.js'
import { QuestionService } from '../../../../../services/question-engine/src/questionService.js'

const generateSchema = z.object({
  topic: z.string().trim().min(1).max(50).default('arrays'),
  difficulty: z.enum(DIFFICULTIES).default('medium'),
})

export function createQuestionRouter(service: QuestionService): Router {
  const router = Router()

  router.post('/generate', validateBody(generateSchema), (request, response) => {
    const result = service.generate(request.body.topic, request.body.difficulty)
    response.status(201).json(result)
  })

  router.get('/:id', (request, response) => {
    const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
    response.json(service.getById(id))
  })

  router.post('/:id/hints', (request, response) => {
    const id = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
    response.json(service.getHint(id))
  })

  return router
}
