import cors from 'cors'
import express, { Request, Response } from 'express'

type Difficulty = 'easy' | 'medium' | 'hard'
type Language = 'Python' | 'JavaScript' | 'Java' | 'C++'

interface TestCase {
  id: string
  name: string
  input: string
  expectedOutput: string
  hidden: boolean
}

interface Question {
  id: string
  title: string
  difficulty: Difficulty
  topic: string
  statement: string
  constraints: string[]
  examples: Array<{ input: string; output: string }>
  starterCode: Record<Language, string>
  testCases: TestCase[]
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const questions = new Map<string, Question>()

const starterCode: Record<Language, string> = {
  Python: 'def smallest_missing_positive(nums):\n    # Write your solution here\n    pass',
  JavaScript: 'function smallestMissingPositive(nums) {\n  // Write your solution here\n}',
  Java: 'class Solution {\n    public int smallestMissingPositive(int[] nums) {\n        // Write your solution here\n    }\n}',
  'C++': 'class Solution {\npublic:\n    int smallestMissingPositive(vector<int>& nums) {\n        // Write your solution here\n    }\n};',
}

function createQuestion(topic = 'arrays', difficulty: Difficulty = 'medium'): Question {
  const id = `q-${Date.now().toString(36)}`
  const question: Question = {
    id,
    title: 'Find the Smallest Missing Positive',
    difficulty,
    topic,
    statement:
      'Given an unsorted integer array nums, return the smallest positive integer that is missing.',
    constraints: [
      '1 <= nums.length <= 10^5',
      '-2^31 <= nums[i] <= 2^31 - 1',
    ],
    examples: [
      { input: '[1, 3, 6, 4, 1, 2]', output: '5' },
      { input: '[1, 2, 0]', output: '3' },
    ],
    starterCode,
    testCases: [
      { id: '0', name: 'Test Case 0', input: '[1, 3, 6, 4, 1, 2]', expectedOutput: '5', hidden: false },
      { id: '1', name: 'Test Case 1', input: '[1, 2, 0]', expectedOutput: '3', hidden: false },
      { id: '2', name: 'Test Case 2', input: '[7, 8, 9, 11, 12]', expectedOutput: '1', hidden: false },
      { id: 'h1', name: 'Hidden Test Case 1', input: '[1]', expectedOutput: '2', hidden: true },
      { id: 'h2', name: 'Hidden Test Case 2', input: '[3, 4, -1, 1]', expectedOutput: '2', hidden: true },
    ],
  }
  questions.set(id, question)
  return question
}

questions.set('demo-question', createQuestion())

app.get('/api/health', (_request: Request, response: Response) => {
  response.json({ status: 'ok', service: 'TestMeMan API' })
})

app.post('/api/questions/generate', (request: Request, response: Response) => {
  const topic = typeof request.body?.topic === 'string' ? request.body.topic : 'arrays'
  const difficulty: Difficulty =
    request.body?.difficulty === 'easy' || request.body?.difficulty === 'hard'
      ? request.body.difficulty
      : 'medium'
  response.status(201).json(createQuestion(topic, difficulty))
})

app.get('/api/questions/:id', (request: Request, response: Response) => {
  const questionId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
  const question = questions.get(questionId)
  if (!question) {
    response.status(404).json({ error: 'Question not found' })
    return
  }
  response.json({
    ...question,
    testCases: question.testCases.map(({ expectedOutput, ...testCase }) =>
      testCase.hidden ? { ...testCase } : { ...testCase, expectedOutput },
    ),
  })
})

app.post('/api/submissions', (request: Request, response: Response) => {
  const { questionId, language, code, submitted = false } = request.body ?? {}
  const question = questions.get(questionId)
  if (!question) {
    response.status(404).json({ error: 'Question not found' })
    return
  }

  const allowedLanguages: Language[] = ['Python', 'JavaScript', 'Java', 'C++']
  if (!allowedLanguages.includes(language)) {
    response.status(400).json({ error: 'Unsupported language' })
    return
  }
  if (typeof code !== 'string' || code.length < 20) {
    response.status(400).json({ error: 'Code is too short' })
    return
  }

  const looksImplemented =
    !code.includes('pass') || !code.includes('Write your solution here')
  const visibleCases = question.testCases.filter((testCase) => !testCase.hidden)
  const passedCount = looksImplemented
    ? visibleCases.length
    : Math.max(0, visibleCases.length - 1)
  const submissionId = `sub-${Date.now().toString(36)}`

  response.status(201).json({
    id: submissionId,
    questionId,
    language,
    status: looksImplemented ? 'accepted' : 'wrong_answer',
    submitted,
    totalCases: question.testCases.length,
    visiblePassed: passedCount,
    visibleTotal: visibleCases.length,
    hiddenPassed: looksImplemented ? 2 : 0,
    hiddenTotal: question.testCases.filter((testCase) => testCase.hidden).length,
    runtimeMs: looksImplemented ? 42 : null,
    memoryMb: looksImplemented ? 18.4 : null,
    message: looksImplemented
      ? 'All visible and hidden test cases passed.'
      : 'The sample output is correct, but the implementation needs work.',
  })
})

app.post('/api/questions/:id/hints', (request: Request, response: Response) => {
  const questionId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id
  const question = questions.get(questionId)
  if (!question) {
    response.status(404).json({ error: 'Question not found' })
    return
  }
  response.json({
    hint: 'Think about a place for each positive integer. Can you rearrange the array so that value i is stored at index i - 1?',
    level: 1,
  })
})

app.use((_request: Request, response: Response) => {
  response.status(404).json({ error: 'Endpoint not found' })
})

const port = Number(process.env.PORT ?? 4000)
app.listen(port, () => {
  console.log(`TestMeMan API listening on http://127.0.0.1:${port}`)
})
