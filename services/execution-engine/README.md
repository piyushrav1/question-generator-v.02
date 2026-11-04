# Execution Engine

This service owns submission execution and evaluation behavior.

## Runner

Submissions use the Docker runner in `src/dockerCodeRunner.ts`:

- Network access is disabled.
- Containers use read-only root filesystems.
- Memory is limited to 256 MB.
- CPU is limited to 0.5 cores.
- Process count is limited to 64.
- Execution has a configurable timeout.
- Source and test input are never shared with the browser client.

Docker must be installed and running on the API host. If Docker is unavailable, submissions return `runtime_error` with a clear execution-service message.

## Configuration

Set `EXECUTION_TIMEOUT_MS` in the API environment to control the per-test timeout. The default is 3000 milliseconds.
