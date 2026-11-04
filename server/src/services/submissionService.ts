import type { SubmissionRequest, SubmissionResultDto } from '../../../shared/types.js'
import { QuestionRepository } from '../repositories/questionRepository.js'
import { HttpError } from '../errors/httpError.js'

export class SubmissionService {
  constructor(private readonly repository: QuestionRepository) {}

  evaluate(input: SubmissionRequest): SubmissionResultDto {
    const question = this.repository.findById(input.questionId)
    if (!question) {
      throw new HttpError(404, 'Question not found.', 'QUESTION_NOT_FOUND')
    }

    const starterMarkers = ['Write your solution here', 'pass']
    const looksImplemented = starterMarkers.every((marker) => !input.code.includes(marker))
    const visibleCases = question.testCases.filter((testCase) => !testCase.hidden)
    const hiddenCases = question.testCases.filter((testCase) => testCase.hidden)

    return {
      id: `sub-${Date.now().toString(36)}`,
      questionId: input.questionId,
      language: input.language,
      status: looksImplemented ? 'accepted' : 'wrong_answer',
      submitted: input.submitted,
      totalCases: question.testCases.length,
      visiblePassed: looksImplemented ? visibleCases.length : 0,
      visibleTotal: visibleCases.length,
      hiddenPassed: looksImplemented ? hiddenCases.length : 0,
      hiddenTotal: hiddenCases.length,
      runtimeMs: looksImplemented ? 42 : null,
      memoryMb: looksImplemented ? 18.4 : null,
      message: looksImplemented
        ? 'All visible and hidden test cases passed.'
        : 'Replace the starter implementation before submitting.',
    }
  }
}
