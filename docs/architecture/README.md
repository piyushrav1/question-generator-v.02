# Architecture

## Overview

TestMeMan is organized as one repository containing an independent React frontend and an Express TypeScript API. The code paths are separated so they can be deployed together or moved into separate services.

## Repository Structure

```text
apps/web/src/           React frontend
apps/api/server/src/    Express API application
services/question-engine/ Question generation and validation
services/execution-engine/ Submission evaluation integration
packages/shared/src/    Contracts shared by frontend and backend
```

## Frontend Responsibilities

- Render the coding workspace.
- Maintain editor and workspace state.
- Call the backend through `apps/web/src/services/apiClient.ts`.
- Keep UI components free from direct API formatting and transport details.

UI code should use shared TypeScript contracts in `packages/shared/src/types.ts` rather than defining independent response shapes.

## Backend Responsibilities

- Validate request input.
- Enforce API contracts.
- Implement question-generation and submission orchestration.
- Redact hidden test-case output.
- Isolate external AI and code-execution providers behind services.

Routes should remain thin. Domain behavior belongs in service classes, while persistent storage belongs in repository classes.

## Integration Boundaries

### AI Provider

Replace question generation inside `QuestionService` and its repository with an adapter for the selected AI provider. Preserve the structured output contract from `packages/shared/src/types.ts`.

### Code Execution

Submission evaluation currently uses a development placeholder. Production execution must be delegated to a separate isolated worker service. Never execute user code directly in the Express process.

### Database

The current in-memory repository is suitable for local development and demonstrations only. Replacing it with PostgreSQL requires implementing the same repository methods, leaving route and service contracts unchanged.

## Request Flow

```text
Browser
  -> apps/web/src/services/apiClient.ts
  -> Express route
  -> request validation
  -> service
  -> repository or provider adapter
  -> JSON response
  -> frontend state
```

## Security Requirements

- Keep provider credentials outside source control.
- Apply authentication at route or application level before production deployment.
- Disable direct user-code execution in the application process.
- Configure strict network, memory, CPU, filesystem, and process limits for workers.
- Hide `expectedOutput` for test cases marked as hidden.
