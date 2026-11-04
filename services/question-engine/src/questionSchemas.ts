import { z } from 'zod'

export const generatedQuestionSchema = z.object({
  title: z.string().trim().min(5).max(120),
  statement: z.string().trim().min(20).max(20_000),
  constraints: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
  examples: z.array(z.object({
    input: z.string().trim().min(1).max(5_000),
    output: z.string().trim().min(1).max(5_000),
  })).min(1).max(5),
  starterCode: z.object({
    Python: z.string().max(5_000),
    JavaScript: z.string().max(5_000),
    Java: z.string().max(5_000),
    'C++': z.string().max(5_000),
  }),
  testCases: z.array(z.object({
    id: z.string().min(1).max(50),
    name: z.string().min(1).max(100),
    input: z.string().min(1).max(20_000),
    expectedOutput: z.string().min(1).max(20_000),
    hidden: z.boolean(),
  })).min(4).max(30),
})
