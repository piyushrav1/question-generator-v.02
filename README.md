# TestMeMan

TestMeMan is an AI-assisted coding practice platform. This repository contains the React frontend and the TypeScript API foundation for a coding workspace with question generation, test-case management, submissions, hints, and isolated execution integration points.

## Repository Status

The frontend is implemented and runnable. The API currently uses an in-memory development repository and a mock submission evaluator. Real AI generation, database persistence, authentication, and secure code execution are designed as replaceable integration boundaries.

## Technology

- React 19 and TypeScript
- Vite
- Express and TypeScript
- Zod request validation
- Helmet and structured HTTP logging
- Shared TypeScript API contracts
- Lucide React

## Getting Started

### Requirements

- Node.js 18 or newer
- npm

### Install

```powershell
npm.cmd install
Copy-Item .env.example .env
```

### Run Frontend and API

```powershell
npm.cmd run dev:all
```

- Frontend: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:4000`
- Health endpoint: `http://127.0.0.1:4000/api/health`

### Run Separately

```powershell
npm.cmd run dev
npm.cmd run server
```

## Commands

| Command | Purpose |
|---|---|
| `npm.cmd run dev` | Start the frontend development server |
| `npm.cmd run server` | Start the API with file watching |
| `npm.cmd run dev:all` | Start frontend and API together |
| `npm.cmd run typecheck` | Type-check frontend and backend |
| `npm.cmd run build` | Create the frontend production build |
| `npm.cmd run check` | Run type checks and the production build |

## Project Layout

```text
src/
  main.tsx             React entry point
  App.tsx              Coding workspace composition
  services/            Frontend API integration
  styles.css           Application styles

shared/
  types.ts             Shared API request and response contracts

server/src/
  app.ts               Express composition
  index.ts             Process entry point
  config/              Environment and logger configuration
  routes/              HTTP route definitions
  middleware/          Validation and error handling
  services/            Business logic
  repositories/        Data-access implementations

docs/
  See ARCHITECTURE.md and API.md
```

Additional files:

- [Architecture](ARCHITECTURE.md)
- [API reference](API.md)
- [Contributing guide](CONTRIBUTING.md)
- [Platform roadmap](AI-Coding-Practice-Platform-Plan.md)

## Configuration

Copy `.env.example` to `.env` and change values for your environment.

Frontend variables are declared by the application through Vite. API variables are read by the server configuration module.

## Integration Notes

- Replace `QuestionRepository` with a database repository without changing route contracts.
- Implement an AI provider adapter in the question service.
- Implement submission evaluation through a queue and isolated execution workers.
- Store authentication context in Express middleware after integrating with the existing identity platform.
- Keep hidden test-case output out of public question responses.

## Production Safety

Do not run submitted user code inside the Express API process. Production submissions require isolated containers or a dedicated execution service with CPU, memory, time, network, filesystem, and process controls.

## License

No license has been added. Add an approved license before distributing or open-sourcing the project.
