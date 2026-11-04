import { GoogleGenAI } from '@google/genai'
import type { Difficulty } from '../../../packages/shared/src/types.js'
import { generatedQuestionSchema } from './questionSchemas.js'
import type { GeneratedQuestion, QuestionProvider } from './provider.js'
import { HttpError } from '../../../packages/shared/src/errors/httpError.js'

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
- Use a deterministic problem with one unambiguous output.
- Include at least 1 visible example and 3 visible test cases.
- Include at least 2 hidden edge test cases.
- Respect the requested topic and difficulty.
- Include boundary, duplicate, minimum, maximum, and performance cases where relevant.
- Do not include explanations, Markdown, comments outside JSON, or code fences.
- Every expectedOutput must be correct for the input.
- Starter code must compile conceptually in each listed language.
- For Python, use a LeetCode-style class named Solution and provide each generated method with explicit parameter names that match the problem.
- For test cases, use named assignments such as "nums = [1, 2, 3], k = 100" whenever a problem has multiple inputs.
- Keep test-case inputs deterministic and parseable as arrays, strings, and numbers.
`

export class GeminiQuestionProvider implements QuestionProvider {
  private readonly client: GoogleGenAI

  constructor(private readonly apiKey: string, private readonly model: string) {
    this.client = new GoogleGenAI({ apiKey })
  }

  async generate(input: { topic: string; difficulty: Difficulty }): Promise<GeneratedQuestion> {
    const maxAttempts = 3

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.client.models.generateContent({
          model: this.model,
          contents: `${questionPrompt}\nTopic: ${input.topic}\nDifficulty: ${input.difficulty}`,
          config: {
            responseMimeType: 'application/json',
          },
        })

        const text = response.text?.trim()
        if (!text) {
          throw new HttpError(502, 'The AI provider returned an empty response.', 'AI_EMPTY_RESPONSE')
        }

        const parsed = generatedQuestionSchema.safeParse(JSON.parse(text))
        if (!parsed.success) {
          throw new HttpError(
            502,
            'The AI provider returned a question that failed validation.',
            'AI_INVALID_RESPONSE',
            parsed.error.flatten(),
          )
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
        throw new HttpError(502, 'The AI question provider is unavailable.', 'AI_PROVIDER_ERROR')
      }
    }

    throw new HttpError(503, 'The AI provider is temporarily unavailable.', 'AI_PROVIDER_UNAVAILABLE')
  }
}
