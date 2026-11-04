import { randomUUID } from 'node:crypto'
import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { DIFFICULTIES, PROGRAMMING_LANGUAGES, type AttemptDto, type ProgrammingLanguage } from '../../../../../packages/shared/src/types.js'
import { QuestionRepository } from '../../../../../services/question-engine/src/questionRepository.js'
import { QuestionService } from '../../../../../services/question-engine/src/questionService.js'
import { validateBody } from '../middleware/validateRequest.js'

const COOKIE_NAME = 'testmeman_session'
const draftSchema = z.object({
  attemptId: z.string().trim().min(1).max(100),
  language: z.enum(PROGRAMMING_LANGUAGES),
  code: z.string().max(100_000).default(''),
  revision: z.coerce.number().int().min(1).default(1),
})
const newAttemptSchema = z.object({
  topic: z.string().trim().min(1).max(50).default('arrays'),
  difficulty: z.enum(DIFFICULTIES).default('medium'),
  language: z.enum(PROGRAMMING_LANGUAGES).default('Python'),
})

export function getOwnerId(request: Request, response: Response): string {
  const cookie = request.headers.cookie?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${COOKIE_NAME}=`))
  const existing = cookie?.slice(COOKIE_NAME.length + 1)
  if (existing) return decodeURIComponent(existing)

  const ownerId = randomUUID()
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  response.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${encodeURIComponent(ownerId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`,
  )
  return ownerId
}

function publicAttempt(attempt: AttemptDto): AttemptDto {
  return {
    ...attempt,
    question: {
      ...attempt.question,
      testCases: attempt.question.testCases.map((testCase) =>
        testCase.hidden
          ? { id: testCase.id, name: testCase.name, input: '', hidden: true }
          : testCase,
      ),
    },
  }
}

export function createAttemptRouter(repository: QuestionRepository, questionService: QuestionService): Router {
  const router = Router()

  router.get('/active', async (request, response, next) => {
    try {
      const ownerId = getOwnerId(request, response)
      let attempt = await repository.findActiveAttempt(ownerId)
      if (!attempt) {
        const question = await questionService.generate('arrays', 'medium')
        attempt = await repository.createAttempt(ownerId, question, 'Python', question.starterCode.Python)
      }
      response.json(publicAttempt(attempt))
    } catch (error) {
      next(error)
    }
  })

  router.get('/resume', async (request, response, next) => {
    try {
      const ownerId = getOwnerId(request, response)
      const attempt = await repository.findActiveAttempt(ownerId)
      response.json(attempt ? publicAttempt(attempt) : null)
    } catch (error) {
      next(error)
    }
  })

  router.post('/new', validateBody(newAttemptSchema), async (request, response, next) => {
    try {
      const ownerId = getOwnerId(request, response)
      const active = await repository.findActiveAttempt(ownerId)
      if (active) await repository.abandonAttempt(ownerId, active.id)
      const question = await questionService.generate(request.body.topic, request.body.difficulty)
      const language = request.body.language as ProgrammingLanguage
      const attempt = await repository.createAttempt(ownerId, question, language, question.starterCode[language])
      response.status(201).json(publicAttempt(attempt))
    } catch (error) {
      next(error)
    }
  })

  router.put('/draft', validateBody(draftSchema), async (request, response, next) => {
    try {
      const ownerId = getOwnerId(request, response)
      const attempt = await repository.saveAttemptDraft(
        ownerId,
        request.body.attemptId,
        request.body.language,
        request.body.code,
        request.body.revision,
      )
      if (!attempt) {
        response.status(404).json({ error: { message: 'Active attempt not found.', code: 'ATTEMPT_NOT_FOUND' } })
        return
      }
      response.json(publicAttempt(attempt))
    } catch (error) {
      next(error)
    }
  })

  return router
}
