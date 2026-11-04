# Web Application

The browser application is responsible for the coding workspace, navigation, editor state, test-case display, and API presentation.

## Structure

- `src/App.tsx`: application composition and workspace state.
- `src/services/`: frontend API client and transport adapters.
- `src/types/`: frontend exports for shared contracts.
- `src/styles.css`: application styling.
- `vite.config.ts`: development server and API proxy configuration.

## Development

Run from the repository root:

```powershell
npm.cmd run dev
```

The frontend expects the API at the same origin by default. Set `VITE_API_BASE_URL` in `apps/web/.env` when a separate API origin is used.
