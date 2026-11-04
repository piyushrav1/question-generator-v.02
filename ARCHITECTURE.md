# Architecture

## Overview

TestMeMan is organized as one repository containing an independent React frontend and an Express TypeScript API. The code paths are separated so they can be deployed together or moved into separate services.

## Repository Structure

```text
src/                    React frontend
shared/types.ts         Contracts shared by the frontend and backend
server/src/app.ts       Express application composition
server/src/config/     Environment and runtime configuration
server/src/routes/     HTTP endpoints
server/src/middleware/ Validation and error handling
server/src/services/   Business logic
server/src/repositories/ Data access
```

## Frontend Responsibilities

- Render the coding workspace.
- Maintain editor and workspace state.
- Call the backend through `src/services/apiClient.ts`.
- Keep UI components free from direct API formatting and transport details.

UI code should use shared TypeScript contracts in `shared/types.ts` rather than defining independent response shapes.

## Backend Responsibilities

- Validate request input.
- Enforce API contracts.
- Implement question-generation and submission orchestration.
- Redact hidden test-case output.
- Isolate external AI and code-execution providers behind services.

Routes should remain thin. Domain behavior belongs in service classes, while persistent storage belongs in repository classes.

## Integration Boundaries

### AI Provider

Replace question generation inside `QuestionService` and its repository with an adapter for the selected AI provider. Preserve the structured output contract from `shared/types.ts`.

### Code Execution

Submission evaluation currently uses a development placeholder. Production execution must be delegated to a separate isolated worker service. Never execute user code directly in the Express process.

### Database

The current in-memory repository is suitable for local development and demonstrations only. Replacing it with PostgreSQL requires implementing the same repository methods, leaving route and service contracts unchanged.

## Request Flow

```text
Browser
  -> src/services/apiClient.ts
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
