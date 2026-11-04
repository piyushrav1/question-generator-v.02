import type { Difficulty, ProgrammingLanguage, QuestionDto, TestCaseDto } from '../../../packages/shared/src/types.js'

export interface GeneratedQuestion {
  title: string
  statement: string
  constraints: string[]
  examples: Array<{ input: string; output: string }>
  starterCode: Record<ProgrammingLanguage, string>
  testCases: TestCaseDto[]
}

export interface QuestionProvider {
  generate(input: { topic: string; difficulty: Difficulty }): Promise<GeneratedQuestion>
}
