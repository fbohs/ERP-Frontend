import type { AuthErrorCode } from '@/types'

const REQUEST_TIMEOUT_MS = 30_000

export class ApiError extends Error {
  constructor(
    readonly code: AuthErrorCode,
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Registered by the auth store on mount. Called on 401s from non-auth routes
// (session expired mid-session). Auth routes (login, logout, setup-password)
// handle their own 401s and must not trigger this handler.
let unauthorizedHandler: (() => Promise<void>) | null = null
export function setUnauthorizedHandler(fn: () => Promise<void>) {
  unauthorizedHandler = fn
}

// Auth routes that produce 401s as part of normal flow (wrong password, expired
// setup token). These must not trigger the unauthorized handler.
const AUTH_PATHS = ['/api/auth/login', '/api/auth/logout', '/api/auth/setup-password', '/api/auth/forgot-password', '/api/auth/reset-password']

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(new Headers(fetchOptions.headers).entries()),
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(path, {
      ...fetchOptions,
      signal: fetchOptions.signal ?? controller.signal,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`)
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) {
    const envelope = await res.json().catch(() => null) as { error?: { code?: string; message?: string } } | null
    const code = (envelope?.error?.code ?? 'INTERNAL_ERROR') as AuthErrorCode
    const message = envelope?.error?.message ?? res.statusText

    if (res.status === 401 && !AUTH_PATHS.includes(path)) {
      void unauthorizedHandler?.()
    }

    throw new ApiError(code, res.status, message)
  }

  const text = await res.text()
  return (text.length === 0 ? null : JSON.parse(text)) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
