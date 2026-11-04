# Question Engine

This service owns AI question generation and question-domain behavior.

## Current Ownership

- `src/questionRepository.ts`: development in-memory question storage.
- `src/questionService.ts`: generation, retrieval, redaction, and hints.

## Integration Work

- Add an AI provider adapter for structured generation.
- Validate generated constraints, examples, and reference solutions.
- Replace in-memory storage with the selected database repository.
- Keep hidden test-case outputs out of public responses.
