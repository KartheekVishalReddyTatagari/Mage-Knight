const BASE = 'http://localhost:8000/api'

let accessToken: string | null = null
let currentUsername: string | null = null

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
  const tokens = await post<{ access_token: string; username: string }>('/auth/login', { email, password })
  accessToken = tokens.access_token
  currentUsername = tokens.username ?? null
}

export async function register(username: string, email: string, password: string): Promise<void> {
  const tokens = await post<{ access_token: string; username: string }>('/auth/register', { username, email, password })
  accessToken = tokens.access_token
  currentUsername = tokens.username ?? username
}

export function logout(): void {
  accessToken = null
  currentUsername = null
}

export function getUsername(): string | null {
  return currentUsername
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

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function adminListSessions() {
  return get<unknown[]>('/admin/sessions')
}

export async function adminDeleteSession(sessionId: string) {
  const res = await fetch(`${BASE}/admin/sessions/${sessionId}`, {
    method: 'DELETE', headers: authHeaders(),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
}

export async function adminListUsers() {
  return get<unknown[]>('/admin/users')
}

export async function adminPromote(email: string, isAdmin: boolean) {
  return post<unknown>('/admin/promote', { email, is_admin: isAdmin })
}
