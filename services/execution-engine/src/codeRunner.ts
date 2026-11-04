import type { ProgrammingLanguage } from '../../../packages/shared/src/types.js'

export interface ExecutionRequest {
  language: ProgrammingLanguage
  code: string
  input: string
  timeoutMs: number
}

export interface ExecutionResult {
  stdout: string
  stderr: string
  timedOut: boolean
  runtimeError: boolean
  runtimeMs: number
}

export interface CodeRunner {
  execute(request: ExecutionRequest): Promise<ExecutionResult>
}
