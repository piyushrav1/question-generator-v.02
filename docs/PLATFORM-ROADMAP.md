# AI Coding Practice Platform — Build Plan

## 1. Product Goal

Create a HackerRank-style coding platform where users can:

- Select a topic, difficulty, language, and time limit.
- Get a fresh AI-generated coding problem.
- Write and run code in an online editor.
- Submit solutions against visible and hidden test cases.
- Receive detailed execution feedback and an AI explanation after submission.

## 2. Core User Flow

1. User selects preferences:
   - Topic: arrays, graphs, dynamic programming, SQL, etc.
   - Difficulty: easy, medium, or hard.
   - Programming language.
   - Question size/time limit.
2. Backend requests an AI-generated problem specification.
3. The generated problem is validated for:
   - Clear instructions.
   - Valid examples.
   - Deterministic output.
   - Constraint correctness.
   - Duplicate or unsafe content.
4. The backend generates visible and hidden test cases.
5. A validator independently executes the solution against generated cases.
6. User runs or submits code.
7. Results are stored and displayed.
8. AI optionally provides:
   - Hint-only coaching.
   - Complexity analysis.
   - Bug analysis.
   - Full explanation after submission.

## 3. Recommended Architecture

### Frontend

Use a responsive split-screen interface:

- Problem description.
- Code editor.
- Test case/results panel.
- Submission history.
- AI tutor sidebar.

Recommended stack:

- Next.js + TypeScript.
- Tailwind CSS or a component library.
- Monaco Editor.

### Backend

Recommended stack:

- Node.js/TypeScript with NestJS or Fastify.
- PostgreSQL for users, questions, submissions, and test cases.
- Redis for queues and caching.
- Object storage for artifacts and logs if needed.

### Code Execution

Do not execute user code on the application server.

Use isolated containers with:

- CPU and memory limits.
- Execution timeout.
- Network disabled.
- Read-only operating system.
- Ephemeral filesystem.
- Restricted processes.
- Automatic container cleanup.

A queue worker should:

1. Receive submission jobs.
2. Build a language-specific container.
3. Compile the solution.
4. Run visible and hidden cases sequentially or in batches.
5. Capture output, errors, time, and memory.
6. Destroy the container.

## 4. AI Question Generation Pipeline

### Step 1: Generate the Specification

The AI produces structured data:

```json
{
  "title": "Minimum Pair Distance",
  "difficulty": "medium",
  "topic": ["arrays", "hashing"],
  "statement": "Problem description...",
  "inputFormat": "Description of input...",
  "outputFormat": "Description of output...",
  "constraints": ["1 <= n <= 100000"],
  "examples": [],
  "starterCode": {
    "javascript": "...",
    "python": "..."
  }
}
```

### Step 2: Generate a Reference Solution

Use AI in one generation session or with a separate model to create a correct implementation.

### Step 3: Generate Edge Cases

Generate test inputs targeting:

- Minimum and maximum constraints.
- Empty or boundary-sized inputs.
- Negatives and duplicates.
- Sorted and reverse-sorted data.
- Large values.
- Invalid-looking but valid cases.
- Overflow-sensitive cases.
- Performance stress cases.

### Step 4: Generate Expected Outputs

Run only the reviewed reference solution in the secure execution environment.

### Step 5: Validate Independently

The system should not trust AI-generated output alone. Validation must verify:

- Test cases are valid.
- Expected outputs are correct.
- Multiple independent solutions agree where practical.
- Reference solutions terminate within limits.
- Examples match generated outputs.
- Hidden cases cover meaningful constraints.

### Step 6: Publish or Discard

Questions pass through:

- AI validation.
- Automated validation.
- Optional human moderation.
- Candidate status.
- Published status.

## 5. Database Structure

Primary entities:

- `users`
- `questions`
- `test_cases`
- `submissions`
- `submission_results`
- `conversation_messages`
- `question_ratings`
- `usage_limits`
- `prompt_versions`

Test cases should include:

```text
questionId
input
expectedOutput
isHidden
difficultyWeight
executionLimit
isGenerated
validationStatus
```

## 6. Evaluation Results

Each submission should return:

- Overall verdict: accepted, wrong answer, runtime error, time limit exceeded, or compilation error.
- Passed visible/hidden case counts.
- Per-case status.
- Runtime and memory usage.
- Error details for visible cases.
- Hidden output redacted.
- Problem-specific feedback.

## 7. MVP Scope

### MVP Features

- Email/account authentication.
- AI question generation by topic and difficulty.
- Three to five programming languages.
- Visible and hidden test cases.
- Online code editor.
- Secure code execution.
- Submission history.
- AI hint button.
- Basic anti-plagiarism safeguards.

### Later Features

- Adaptive difficulty.
- Personalized learning paths.
- Community leaderboard.
- Question ratings and reports.
- Contest mode.
- Database and shell problems.
- Video-style generated editorial.
- AI-based code style feedback.
- Team/class dashboards.
- Mobile editor improvements.

## 8. API Outline

```text
POST /api/questions/generate
GET  /api/questions/:id
POST /api/submissions
GET  /api/submissions/:id
GET  /api/submissions/:id/results
POST /api/questions/:id/hints
POST /api/questions/:id/feedback
POST /api/moderation/reports
```

## 9. Security and Reliability

Important controls:

- API authentication and submission rate limits.
- Server-side AI usage budgets.
- Prompt-injection resistance for user code.
- Hardened container runners.
- Restricted network access.
- Per-user execution quotas.
- Malware/process safety checks.
- Idempotent submission processing.
- Raw user code encryption at rest if required.
- Audit logs for generated questions and test cases.

## 10. Development Phases

### Phase 1 — Foundation

- Set up frontend and backend.
- Add authentication.
- Create question and submission schemas.
- Build Monaco Editor interface.

### Phase 2 — Question Engine

- Integrate AI generation.
- Add structured question output.
- Implement reference-solution generation.
- Add test-case generation and validation.

### Phase 3 — Execution Engine

- Container execution workers.
- Language images.
- Submission queues.
- Verdict processing.

### Phase 4 — UI and Feedback

- Build problem workspace.
- Add hidden case handling.
- Add hints and explanations.
- Add submission history.

### Phase 5 — Quality and Safety

- Add moderation workflows.
- Add question-quality metrics.
- Load-test the execution system.
- Add abuse prevention and cost limits.

## 11. Suggested Initial Tech Stack

- Frontend: Next.js, TypeScript, Monaco, Tailwind.
- Backend: Fastify or NestJS with TypeScript.
- Database: PostgreSQL.
- Queue: Redis + BullMQ.
- Execution: Docker containers or Kubernetes Jobs.
- AI: Structured LLM API calls.
- Storage: S3-compatible object storage.
- Deployment: AWS, Azure, or DigitalOcean.

## 12. Milestone Deliverables

- **Week 1:** Wireframes and database design.
- **Week 2–3:** Coding workspace and authentication.
- **Week 4:** AI question-generation pipeline.
- **Week 5–6:** Secure execution workers.
- **Week 7:** Hidden tests, submission history, and hints.
- **Week 8:** Testing, moderation, optimization, and launch.

The highest-risk area is secure code execution, so it should be built as a separate service rather than embedded into the main application API.
