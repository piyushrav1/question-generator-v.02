# Contributing

## Setup

```powershell
npm.cmd install
cp .env.example .env
npm.cmd run dev:all
```

## Commands

| Command | Purpose |
|---|---|
| `npm.cmd run dev` | Start the frontend development server |
| `npm.cmd run server` | Start the API with file watching |
| `npm.cmd run dev:all` | Start frontend and API together |
| `npm.cmd run typecheck` | Type-check frontend and backend |
| `npm.cmd run build` | Build the frontend |
| `npm.cmd run check` | Run type checks and the frontend build |

## Change Boundaries

- `src/` owns browser presentation and client state.
- `server/src/routes/` owns endpoint composition.
- `server/src/services/` owns application behavior.
- `server/src/repositories/` owns persistence access.
- `shared/types.ts` owns cross-layer API contracts.

Avoid importing Express or HTTP types from a business service. Avoid placing persistence logic in route handlers.

## Before Submitting a Change

1. Add or update relevant tests.
2. Run `npm.cmd run check`.
3. Update API or architecture documentation for integration changes.
4. Keep environment-specific values in environment variables.
5. Ensure hidden test-case outputs are never returned by public endpoints.
