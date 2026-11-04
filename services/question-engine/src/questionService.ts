import type { Difficulty, QuestionDto } from '../../../packages/shared/src/types.js'
import { QuestionRepository } from './questionRepository.js'
import { HttpError } from '../../../packages/shared/src/errors/httpError.js'
import type { QuestionProvider } from './provider.js'

export class QuestionService {
  constructor(
    private readonly repository: QuestionRepository,
    private readonly provider?: QuestionProvider,
  ) {}

  async generate(topic: string, difficulty: Difficulty): Promise<QuestionDto> {
    if (!this.provider) {
      throw new HttpError(
        503,
        'AI question generation is not configured. Set GEMINI_API_KEY on the API server.',
        'AI_PROVIDER_NOT_CONFIGURED',
      )
    }
    const generated = await this.provider.generate({ topic, difficulty })
    const question = await this.repository.save({ topic, difficulty, generated })
    return await this.getById(question.id)
  }

  async getById(id: string): Promise<QuestionDto> {
    const question = await this.repository.findById(id)
    if (!question) {
      throw new HttpError(404, 'Question not found.', 'QUESTION_NOT_FOUND')
    }
    return {
      ...question,
      testCases: question.testCases.map((testCase) =>
        testCase.hidden
          ? { id: testCase.id, name: testCase.name, input: '', hidden: true }
          : testCase,
      ),
    }
  }

  async getHint(id: string): Promise<{ hint: string; level: number }> {
    await this.getById(id)
    return {
      hint: 'Consider whether each positive integer can be stored at the index corresponding to its value minus one. Use the array itself for state.',
      level: 1,
    }
  }
}
