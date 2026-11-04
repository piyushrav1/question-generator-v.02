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
    const question = this.repository.save({ topic, difficulty, generated })
    return this.getById(question.id)
  }

  getById(id: string): QuestionDto {
    const question = this.repository.findById(id)
    if (!question) {
      throw new HttpError(404, 'Question not found.', 'QUESTION_NOT_FOUND')
    }
    return {
      ...question,
      testCases: question.testCases.map((testCase) =>
        testCase.hidden
          ? { id: testCase.id, name: testCase.name, input: testCase.input, hidden: true }
          : testCase,
      ),
    }
  }

  getHint(id: string): { hint: string; level: number } {
    this.getById(id)
    return {
      hint: 'Consider whether each positive integer can be stored at the index corresponding to its value minus one. Use the array itself for state.',
      level: 1,
    }
  }
}
