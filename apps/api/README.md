# API Application

The API application is the HTTP composition layer for TestMeMan. It owns routing, request validation, middleware, configuration, and service wiring.

## Structure

- `server/src/app.ts`: middleware and dependency composition.
- `server/src/index.ts`: process entry point.
- `server/src/routes/`: HTTP endpoint definitions.
- `server/src/middleware/`: validation and error handling.
- `server/src/config/`: environment and logging configuration.
- `tsconfig.server.json`: API TypeScript build configuration.

## Development

Run from the repository root:

```powershell
npm.cmd run server
```

Set API environment variables using `apps/api/.env`.
