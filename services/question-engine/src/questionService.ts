import type { Difficulty, QuestionDto } from '../../../packages/shared/src/types.js'
import { QuestionRepository } from './questionRepository.js'
import { HttpError } from '../../../packages/shared/src/errors/httpError.js'

export class QuestionService {
  constructor(private readonly repository: QuestionRepository) {}

  generate(topic: string, difficulty: Difficulty): QuestionDto {
    const question = this.repository.create({ topic, difficulty })
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
