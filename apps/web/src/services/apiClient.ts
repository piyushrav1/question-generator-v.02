import type { AttemptDto, GenerateQuestionRequest, QuestionDto, SubmissionRequest, SubmissionResultDto } from '../../../../packages/shared/src/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const payload = await response.json().catch(() => null) as
    | T
    | { error?: { message?: string; code?: string } }
    | null

  if (!response.ok) {
    const errorPayload = payload as { error?: { message?: string; code?: string } } | null
    throw new ApiError(
      errorPayload?.error?.message ?? 'The request could not be completed.',
      response.status,
      errorPayload?.error?.code,
    )
  }
  return payload as T
}

export const apiClient = {
  health: () => request<{ status: string }>('/api/health'),
  getActiveAttempt: () => request<AttemptDto>('/api/attempts/active'),
  createNewAttempt: (input: GenerateQuestionRequest = {}) =>
    request<AttemptDto>('/api/attempts/new', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  saveAttemptDraft: (input: { attemptId: string; language: AttemptDto['language']; code: string; revision: number }) =>
    request<AttemptDto>('/api/attempts/draft', {
      method: 'PUT',
      body: JSON.stringify(input),
    }),
  generateQuestion: (input: GenerateQuestionRequest = {}) =>
    request<QuestionDto>('/api/questions/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getQuestion: (id: string) => request<QuestionDto>(`/api/questions/${encodeURIComponent(id)}`),
  submit: (input: SubmissionRequest) =>
    request<SubmissionResultDto>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getHint: (questionId: string) =>
    request<{ hint: string; level: number }>(`/api/questions/${encodeURIComponent(questionId)}/hints`, {
      method: 'POST',
    }),
}
