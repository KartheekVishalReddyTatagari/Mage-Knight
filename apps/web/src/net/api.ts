const BASE = 'http://localhost:8000/api'

let accessToken: string | null = null

function authHeaders(): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<void> {
  const tokens = await post<{ access_token: string }>('/auth/login', { email, password })
  accessToken = tokens.access_token
}

export async function register(username: string, email: string, password: string): Promise<void> {
  const tokens = await post<{ access_token: string }>('/auth/register', { username, email, password })
  accessToken = tokens.access_token
}

export function logout(): void {
  accessToken = null
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function listSessions() {
  return get<unknown[]>('/sessions/')
}

export async function createSession(opts: { mode: string; scenario_id: string }) {
  return post<unknown>('/sessions/', opts)
}

export async function joinSession(sessionId: string) {
  return post<unknown>(`/sessions/${sessionId}/join`, {})
}

export function getToken(): string | null {
  return accessToken
}
