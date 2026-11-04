import type { Difficulty, ProgrammingLanguage, QuestionDto, TestCaseDto } from '../../../packages/shared/src/types.js'

const starterCode: Record<ProgrammingLanguage, string> = {
  Python: 'def smallest_missing_positive(nums):\n    # Write your solution here\n    pass',
  JavaScript: 'function smallestMissingPositive(nums) {\n  // Write your solution here\n}',
  Java: 'class Solution {\n    public int smallestMissingPositive(int[] nums) {\n        // Write your solution here\n    }\n}',
  'C++': 'class Solution {\npublic:\n    int smallestMissingPositive(vector<int>& nums) {\n        // Write your solution here\n    }\n};',
}

export class QuestionRepository {
  private readonly questions = new Map<string, QuestionDto>()

  constructor() {
    const demoQuestion = this.create({
      topic: 'arrays',
      difficulty: 'medium',
    })
    this.questions.set('demo-question', demoQuestion)
  }

  create(input: { topic: string; difficulty: Difficulty }): QuestionDto {
    const id = `q-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const testCases: TestCaseDto[] = [
      { id: '0', name: 'Test Case 0', input: '[1, 3, 6, 4, 1, 2]', expectedOutput: '5', hidden: false },
      { id: '1', name: 'Test Case 1', input: '[1, 2, 0]', expectedOutput: '3', hidden: false },
      { id: '2', name: 'Test Case 2', input: '[7, 8, 9, 11, 12]', expectedOutput: '1', hidden: false },
      { id: 'h1', name: 'Hidden Test Case 1', input: '[1]', expectedOutput: '2', hidden: true },
      { id: 'h2', name: 'Hidden Test Case 2', input: '[3, 4, -1, 1]', expectedOutput: '2', hidden: true },
    ]
    const question: QuestionDto = {
      id,
      title: 'Find the Smallest Missing Positive',
      difficulty: input.difficulty,
      topic: input.topic,
      statement: 'Given an unsorted integer array nums, return the smallest positive integer that is missing.',
      constraints: ['1 <= nums.length <= 10^5', '-2^31 <= nums[i] <= 2^31 - 1'],
      examples: [
        { input: '[1, 3, 6, 4, 1, 2]', output: '5' },
        { input: '[1, 2, 0]', output: '3' },
      ],
      starterCode,
      testCases,
    }
    this.questions.set(id, question)
    return question
  }

  findById(id: string): QuestionDto | undefined {
    return this.questions.get(id)
  }
}
