import type { SubmissionRequest, SubmissionResultDto } from '../../../packages/shared/src/types.js'
import { QuestionRepository } from '../../question-engine/src/questionRepository.js'
import { HttpError } from '../../../packages/shared/src/errors/httpError.js'
import { DockerCodeRunner } from './dockerCodeRunner.js'
import type { CodeRunner } from './codeRunner.js'

export class SubmissionService {
  constructor(
    private readonly repository: QuestionRepository,
    private readonly runner: CodeRunner = new DockerCodeRunner(),
    private readonly timeoutMs = 3000,
  ) {}

  async evaluate(input: SubmissionRequest): Promise<SubmissionResultDto> {
    const question = this.repository.findById(input.questionId)
    if (!question) {
      throw new HttpError(404, 'Question not found.', 'QUESTION_NOT_FOUND')
    }

    const visibleCases = question.testCases.filter((testCase) => !testCase.hidden)
    const hiddenCases = question.testCases.filter((testCase) => testCase.hidden)
    const visiblePassed = await this.countPassed(visibleCases, input)
    const hiddenPassed = await this.countPassed(hiddenCases, input)
    const runtimeError = visiblePassed.error || hiddenPassed.error
    const timedOut = visiblePassed.timedOut || hiddenPassed.timedOut
    const totalVisible = visiblePassed.count
    const totalHidden = hiddenPassed.count
    const passedAll = visiblePassed.count === visibleCases.length && hiddenPassed.count === hiddenCases.length
    const status = timedOut
      ? 'time_limit_exceeded'
      : runtimeError
        ? 'runtime_error'
        : passedAll
          ? 'accepted'
          : 'wrong_answer'
    const runtimeValues = [...visiblePassed.runtimeMs, ...hiddenPassed.runtimeMs]

    return {
      id: `sub-${Date.now().toString(36)}`,
      questionId: input.questionId,
      language: input.language,
      status,
      submitted: input.submitted,
      totalCases: question.testCases.length,
      visiblePassed: visiblePassed.count,
      visibleTotal: visibleCases.length,
      hiddenPassed: hiddenPassed.count,
      hiddenTotal: hiddenCases.length,
      runtimeMs: runtimeValues.length ? Math.round(runtimeValues.reduce((sum, value) => sum + value, 0) / runtimeValues.length) : null,
      memoryMb: null,
      message: status === 'accepted'
        ? 'All visible and hidden test cases passed.'
        : status === 'time_limit_exceeded'
          ? 'Execution exceeded the allowed time limit.'
          : status === 'runtime_error'
            ? 'Your submission could not be executed. Check the language and syntax.'
            : 'One or more test cases failed.',
    }
  }

  private async countPassed(
    testCases: Array<{ input: string; expectedOutput?: string }>,
    input: SubmissionRequest,
  ): Promise<{ count: number; error: boolean; timedOut: boolean; runtimeMs: number[] }> {
    let count = 0
    let error = false
    let timedOut = false
    const runtimeMs: number[] = []

    for (const testCase of testCases) {
      const result = await this.runner.execute({
        language: input.language,
        code: input.code,
        input: testCase.input,
        timeoutMs: this.timeoutMs,
      })
      runtimeMs.push(result.runtimeMs)
      if (result.timedOut) timedOut = true
      if (result.runtimeError) error = true
      if (!result.timedOut && !result.runtimeError && result.stdout.trim() === testCase.expectedOutput?.trim()) {
        count += 1
      }
      if (timedOut || error) break
    }

    return { count, error, timedOut, runtimeMs }
  }
}
