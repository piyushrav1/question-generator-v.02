import { z } from 'zod'

export const generatedQuestionSchema = z.object({
  title: z.string().trim().min(10).max(120),
  statement: z.string().trim().min(80).max(20_000),
  constraints: z.array(z.string().trim().min(1).max(500)).min(2).max(20),
  examples: z.array(z.object({
    input: z.string().trim().min(1).max(5_000),
    output: z.string().trim().min(1).max(5_000),
  })).min(1).max(5),
  starterCode: z.object({
    Python: z.string().trim().min(20).max(5_000),
    JavaScript: z.string().trim().min(20).max(5_000),
    Java: z.string().trim().min(20).max(5_000),
    'C++': z.string().trim().min(20).max(5_000),
  }),
  testCases: z.array(z.object({
    id: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    input: z.string().min(1).max(20_000),
    expectedOutput: z.string().min(1).max(20_000),
    hidden: z.boolean(),
  })).min(5).max(30),
}).superRefine((question, context) => {
  const incompletePattern = /\b(todo|tbd|unknown|null|n\/a|pass\b|placeholder|not implemented)\b/i
  if (incompletePattern.test(question.title) || incompletePattern.test(question.statement)) {
    context.addIssue({ code: 'custom', message: 'Title and statement must contain complete problem text.', path: ['statement'] })
  }
  for (const [language, starter] of Object.entries(question.starterCode)) {
    if (incompletePattern.test(starter)) {
      context.addIssue({ code: 'custom', message: `${language} starter code must not contain placeholders.`, path: ['starterCode', language] })
    }
  }
  const visibleCases = question.testCases.filter((testCase) => !testCase.hidden)
  const hiddenCases = question.testCases.filter((testCase) => testCase.hidden)
  if (visibleCases.length < 3) {
    context.addIssue({ code: 'custom', message: 'At least 3 visible test cases are required.', path: ['testCases'] })
  }
  if (hiddenCases.length < 2) {
    context.addIssue({ code: 'custom', message: 'At least 2 hidden test cases are required.', path: ['testCases'] })
  }

  const ids = new Set<string>()
  const names = new Set<string>()
  const inputs = new Set<string>()
  for (const [index, testCase] of question.testCases.entries()) {
    if (ids.has(testCase.id)) {
      context.addIssue({ code: 'custom', message: 'Test-case ids must be unique.', path: ['testCases', index, 'id'] })
    }
    ids.add(testCase.id)
    const normalizedName = testCase.name.trim().toLowerCase().replace(/\s+/g, ' ')
    if (names.has(normalizedName)) {
      context.addIssue({ code: 'custom', message: 'Test-case names must be unique.', path: ['testCases', index, 'name'] })
    }
    names.add(normalizedName)
    const normalizedInput = testCase.input.trim().replace(/\s+/g, '')
    if (inputs.has(normalizedInput)) {
      context.addIssue({ code: 'custom', message: 'Test-case inputs must be unique.', path: ['testCases', index, 'input'] })
    }
    inputs.add(normalizedInput)
    if (!testCase.expectedOutput.trim() || /^(todo|unknown|null|n\/a)$/i.test(testCase.expectedOutput.trim())) {
      context.addIssue({ code: 'custom', message: 'Each test case needs a concrete expected output.', path: ['testCases', index, 'expectedOutput'] })
    }
  }
})
