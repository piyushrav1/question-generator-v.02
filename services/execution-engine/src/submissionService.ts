import type { ProgrammingLanguage, SubmissionCaseResultDto, SubmissionRequest, SubmissionResultDto } from '../../../packages/shared/src/types.js'
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
    const question = await this.repository.findById(input.questionId)
    if (!question) {
      throw new HttpError(404, 'Question not found.', 'QUESTION_NOT_FOUND')
    }

    if (typeof input.customInput === 'string') {
      const result = await this.runner.execute({
        language: input.language,
        code: this.prepareCode(input.language, input.code),
        input: input.customInput,
        timeoutMs: this.timeoutMs,
      })
      const status = result.timedOut
        ? 'time_limit_exceeded'
        : result.runtimeError
          ? 'runtime_error'
          : 'accepted'
      const customResult: SubmissionResultDto = {
        id: `sub-${Date.now().toString(36)}`,
        questionId: input.questionId,
        language: input.language,
        status,
        submitted: false,
        totalCases: 1,
        visiblePassed: 0,
        visibleTotal: 1,
        hiddenPassed: 0,
        hiddenTotal: 0,
        runtimeMs: result.runtimeMs,
        memoryMb: null,
        message: status === 'time_limit_exceeded'
          ? 'Custom test execution exceeded the allowed time limit.'
          : status === 'runtime_error'
            ? result.stderr || 'Custom test could not be executed.'
            : 'Custom test completed.',
        caseResults: [{
          id: 'custom',
          name: 'Custom Test',
          hidden: false,
          status: status === 'accepted' ? 'passed' : status,
          actualOutput: result.stdout.trim(),
          runtimeMs: result.runtimeMs,
        }],
      }
      await this.repository.saveSubmission(customResult)
      return customResult
    }

    const visibleCases = question.testCases.filter((testCase) => !testCase.hidden)
    const hiddenCases = input.submitted ? question.testCases.filter((testCase) => testCase.hidden) : []
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

    const result: SubmissionResultDto = {
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
      caseResults: visiblePassed.caseResults,
      message: status === 'accepted'
        ? 'All visible and hidden test cases passed.'
        : status === 'time_limit_exceeded'
          ? 'Execution exceeded the allowed time limit.'
          : status === 'runtime_error'
            ? (visiblePassed.stderr || hiddenPassed.stderr || 'Your submission could not be executed. Check the language and syntax.')
            : 'One or more test cases failed.',
    }

    await this.repository.saveSubmission(result)
    return result
  }

  private prepareCode(language: ProgrammingLanguage, code: string): string {
    if (language !== 'Python' || !/\bclass\s+Solution\b/.test(code)) {
      return code
    }

    return `${code}

if __name__ == "__main__":
    import ast
    import json
    import re
    import sys

    raw = sys.stdin.read().strip()
    values = {}

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, dict):
            values.update(parsed)
        elif isinstance(parsed, list):
            values["args"] = [parsed]
    except Exception:
        pass

    for name, value_text in re.findall(
        r"([A-Za-z_]\\w*)\\s*=\\s*(\\[[^\\]]*\\]|-?\\d+(?:\\.\\d+)?)",
        raw,
        re.S,
    ):
        try:
            values[name] = ast.literal_eval(value_text)
        except Exception:
            values[name] = value_text

    if not values:
        parts = [part.strip() for part in raw.splitlines() if part.strip()]
        positional = []
        for part in parts:
            try:
                positional.append(ast.literal_eval(part))
            except Exception:
                positional.append(part)
        values["args"] = positional

    solution = Solution()
    method = next(
        (
            getattr(solution, name)
            for name in dir(solution)
            if not name.startswith("_") and callable(getattr(solution, name))
        ),
        None,
    )

    if method is None:
        print("")
    else:
        function = getattr(method, "__func__", method)
        parameter_names = list(function.__code__.co_varnames[1:function.__code__.co_argcount])
        arguments = []
        fallback = values.get("args", [])
        defaults = function.__defaults__ or ()
        default_names = parameter_names[-len(defaults):] if defaults else []

        for index, parameter_name in enumerate(parameter_names):
            if parameter_name in values:
                arguments.append(values[parameter_name])
            elif index < len(fallback):
                arguments.append(fallback[index])
            elif parameter_name in default_names:
                arguments.append(defaults[default_names.index(parameter_name)])
            else:
                arguments.append(None)

        result = method(*arguments)
        if isinstance(result, (dict, list, tuple)):
            print(json.dumps(result))
        else:
            print(result)
`
  }

  private async countPassed(
    testCases: Array<{ id: string; name: string; input: string; expectedOutput?: string; hidden: boolean }>,
    input: SubmissionRequest,
  ): Promise<{ count: number; error: boolean; timedOut: boolean; runtimeMs: number[]; stderr: string; caseResults: SubmissionCaseResultDto[] }> {
    let count = 0
    let error = false
    let timedOut = false
    let stderr = ''
    const runtimeMs: number[] = []
    const caseResults: SubmissionCaseResultDto[] = []

    for (const testCase of testCases) {
      const result = await this.runner.execute({
        language: input.language,
        code: this.prepareCode(input.language, input.code),
        input: testCase.input,
        timeoutMs: this.timeoutMs,
      })
      runtimeMs.push(result.runtimeMs)
      if (result.stderr) stderr = result.stderr
      if (result.timedOut) timedOut = true
      if (result.runtimeError) error = true
      const passed = !result.timedOut && !result.runtimeError && result.stdout.trim() === testCase.expectedOutput?.trim()
      if (passed) {
        count += 1
      }
      caseResults.push({
        id: testCase.id,
        name: testCase.hidden ? 'Hidden Test Case' : testCase.name,
        hidden: testCase.hidden,
        status: result.timedOut
          ? 'time_limit_exceeded'
          : result.runtimeError
            ? 'runtime_error'
            : passed
              ? 'passed'
              : 'wrong_answer',
        actualOutput: testCase.hidden ? undefined : result.stdout.trim(),
        expectedOutput: testCase.hidden ? undefined : testCase.expectedOutput,
        runtimeMs: result.runtimeMs,
      })
      if (timedOut || error) break
    }

    return { count, error, timedOut, runtimeMs, stderr, caseResults }
  }
}
