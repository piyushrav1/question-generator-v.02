import { GoogleGenAI } from '@google/genai'
import type { Difficulty } from '../../../packages/shared/src/types.js'
import { generatedQuestionSchema } from './questionSchemas.js'
import type { GeneratedQuestion, QuestionProvider } from './provider.js'
import { HttpError } from '../../../packages/shared/src/errors/httpError.js'
import { randomUUID } from 'node:crypto'

const questionPrompt = `Create a coding interview problem as valid JSON only.
The JSON must match this structure:
{
  "title": "string",
  "statement": "string",
  "constraints": ["string"],
  "examples": [{"input": "string", "output": "string"}],
  "starterCode": {
    "Python": "string",
    "JavaScript": "string",
    "Java": "string",
    "C++": "string"
  },
  "testCases": [{"id": "string", "name": "string", "input": "string", "expectedOutput": "string", "hidden": boolean}]
}

Requirements:
- Create an original, interview-quality problem; do not copy a LeetCode problem title or wording verbatim.
- Define every input, output, and edge-case precisely so independent readers produce the same result.
- Use a deterministic algorithmic problem with exactly one well-defined output.
- Match the difficulty honestly: easy questions use one core idea, medium add combinations, and hard require advanced reasoning or constraints.
- Include complexity expectations in the statement when useful, based on the numeric constraints.
- Do not generate trivial, placeholder, contradictory, duplicate, or underspecified problems.
- Include at least 1 visible example and 3 visible test cases.
- Include at least 2 hidden edge test cases; every hidden input and expected output must be complete and non-empty.
- Visible and hidden test cases should cover minimum values, maximum values, duplicates, empty-by-definition if allowed, and boundary transitions.
- For array/string problems, test order independence only when the problem actually requires it.
- Use realistic constraints and ensure generated inputs remain within every stated constraint.
- Keep every test case small enough to execute locally but large enough to cover the edge behavior.
- Respect the requested topic and difficulty.
- Include boundary, duplicate, minimum, maximum, and performance cases where relevant.
- Do not include explanations, Markdown, comments outside JSON, or code fences.
- Every expectedOutput must be correct for the input.
- Starter code must compile conceptually in each listed language.
- Starter code must contain a real method/function signature for the problem, with no TODO text, explanatory placeholders, or \`pass\` bodies.
- For JavaScript, support class-style or function-style starter code, but use the same parameter names as every test case.
- For Java and C++, use public/non-static Solution method signatures suitable for LeetCode-style execution.
- For C++, prefer a LeetCode-style class named Solution and include the correct \`vector\` includes when not wrapped.
- For JavaScript and Python, use the exact parameter names shown in named test-case assignments.
- Generate output as a primitive string, integer, boolean, JSON array, or JSON object only when the statement defines that format.
- For Python, use a LeetCode-style class named Solution and provide each generated method with explicit parameter names that match the problem.
- For test cases, use named assignments such as "nums = [1, 2, 3], k = 100" whenever a problem has multiple inputs.
- Keep test-case inputs deterministic and parseable as arrays, strings, and numbers.
- Expected outputs must be mathematically verified and must not contain Markdown, labels, or extra whitespace.
- Do not repeat the same input with different labels or expected outputs.
- Use unique, short descriptive names for every visible and hidden test case.
`

export class GeminiQuestionProvider implements QuestionProvider {
  private readonly client: GoogleGenAI

  constructor(private readonly apiKey: string, private readonly model: string) {
    this.client = new GoogleGenAI({ apiKey })
  }

  private validateQuestionQuality(question: GeneratedQuestion): string | null {
    const visibleText = `${question.title}\n${question.statement}`.toLowerCase()
    if (visibleText.includes('todo') || visibleText.includes('placeholder') || visibleText.includes('coming soon')) {
      return 'The AI provider returned incomplete problem text.'
    }
    if (question.title.trim().length < 10 || question.statement.trim().length < 80) {
      return 'The AI provider returned an underspecified coding problem.'
    }
    if (question.constraints.length < 2) {
      return 'The AI provider must include realistic upper and lower bounds.'
    }
    if (question.examples.length < 1) {
      return 'The AI provider must include at least one worked example.'
    }

    const visibleCases = question.testCases.filter((testCase) => !testCase.hidden)
    const hiddenCases = question.testCases.filter((testCase) => testCase.hidden)
    if (visibleCases.length < 3 || hiddenCases.length < 2) {
      return 'The AI provider returned insufficient visible or hidden test coverage.'
    }
    if (question.testCases.some((testCase) => !testCase.name.trim() || !testCase.input.trim() || !(testCase.expectedOutput?.trim()))) {
      return 'Every generated test case must have a complete name, input, and expected output.'
    }

    const placeholderPatterns = /\b(TODO|TBD|pass\b|write your solution|not implemented|unknown|placeholder)\b/i
    const starterValues = Object.values(question.starterCode)
    if (starterValues.some((starter) => placeholderPatterns.test(starter))) {
      return 'The AI provider returned starter code with placeholder implementation.'
    }
    return null
  }

  async generate(input: { topic: string; difficulty: Difficulty }): Promise<GeneratedQuestion> {
    const maxAttempts = 3
    const requestId = randomUUID()

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: `${questionPrompt}\nTopic: ${input.topic}\nDifficulty: ${input.difficulty}\nVariation: ${requestId}-${attempt}`,
          config: {
            responseMimeType: 'application/json',
          },
        })

        const text = response.text?.trim()
        if (!text) {
          if (attempt < maxAttempts) continue
          throw new HttpError(502, 'The AI provider returned an empty response.', 'AI_EMPTY_RESPONSE')
        }

        const parsed = generatedQuestionSchema.safeParse(JSON.parse(text.replace(/^\uFEFF/, '').trim()))
        if (!parsed.success) {
          if (attempt < maxAttempts) continue
          throw new HttpError(502, 'The AI provider returned a question that failed validation.', 'AI_INVALID_RESPONSE', parsed.error.flatten())
        }
        const qualityError = this.validateQuestionQuality(parsed.data)
        if (qualityError) {
          if (attempt < maxAttempts) continue
          throw new HttpError(502, qualityError, 'AI_LOW_QUALITY_RESPONSE', { variation: requestId })
        }
        return parsed.data
      } catch (error) {
        if (error instanceof HttpError) throw error

        const status = typeof error === 'object' && error !== null && 'status' in error
          ? Number(error.status)
          : undefined

        if ((status === 429 || status === 503) && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)))
          continue
        }

        if (status === 429) {
          throw new HttpError(429, 'The AI provider quota is temporarily exhausted.', 'AI_RATE_LIMITED')
        }
        if (status === 503) {
          throw new HttpError(503, 'The AI provider is temporarily unavailable.', 'AI_PROVIDER_UNAVAILABLE')
        }
        if (status === 404) {
          throw new HttpError(502, 'The configured AI model is unavailable.', 'AI_MODEL_UNAVAILABLE')
        }
        if (attempt < maxAttempts) continue
        throw new HttpError(502, 'The AI question provider is unavailable.', 'AI_PROVIDER_ERROR')
      }
    }

    throw new HttpError(503, 'The AI provider is temporarily unavailable.', 'AI_PROVIDER_UNAVAILABLE')
  }
}
