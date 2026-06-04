import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../net/api'

interface SessionRow {
  session_id: string; name: string; mode: string; state: string
  player_count: number; max_players: number; created_at: string
}
interface UserRow {
  id: string; username: string; email: string; is_admin: boolean
}

type Tab = 'sessions' | 'users'

export default function AdminPage() {
  const navigate  = useNavigate()
  const [tab, setTab]           = useState<Tab>('sessions')
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [users,    setUsers]    = useState<UserRow[]>([])
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [promoteEmail, setPromoteEmail] = useState('')
  const [promoteMsg,   setPromoteMsg]   = useState<string | null>(null)

  async function loadSessions() {
    setLoading(true); setError(null)
    try { setSessions(await api.adminListSessions() as SessionRow[]) }
    catch (e: any) { setError(e.message ?? 'Failed to load — are you an admin?') }
    finally { setLoading(false) }
  }

  async function loadUsers() {
    setLoading(true); setError(null)
    try { setUsers(await api.adminListUsers() as UserRow[]) }
    catch (e: any) { setError(e.message ?? 'Failed to load') }
    finally { setLoading(false) }
  }

  async function deleteSession(id: string) {
    if (!confirm(`Delete session "${id.slice(0, 8)}…"?`)) return
    try { await api.adminDeleteSession(id); setSessions(s => s.filter(x => x.session_id !== id)) }
    catch (e: any) { setError(e.message) }
  }

  async function handlePromote(email: string, isAdmin: boolean) {
    try {
      await api.adminPromote(email, isAdmin)
      setPromoteMsg(`✅ ${email} is now ${isAdmin ? 'an admin' : 'a regular user'}`)
      loadUsers()
    } catch (e: any) { setError(e.message) }
  }

  useEffect(() => {
    if (tab === 'sessions') loadSessions()
    else loadUsers()
  }, [tab])

  const stateColor = (s: string) => ({
    LOBBY:   { bg: 'rgba(74,222,128,0.08)',  color: '#4ade80'  },
    PLAYING: { bg: 'rgba(245,158,11,0.08)',  color: '#fbbf24'  },
    ENDED:   { bg: 'rgba(100,100,100,0.08)', color: '#6b7280'  },
  }[s] ?? { bg: 'rgba(100,100,100,0.08)', color: '#9ca3af' })

  const modeColor = (m: string) => ({
    solo:   '#a855f7', coop: '#06b6d4', versus: '#ef4444',
  }[m] ?? '#9ca3af')

  return (
    <div style={{ minHeight: '100vh', background: '#06060f', color: '#e0e0e0', padding: 32 }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>⚙ Admin Panel</span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                background: 'rgba(245,158,11,0.1)', color: '#f59e0b', letterSpacing: '0.1em',
              }}>ADMIN</span>
            </div>
            <div style={{ fontSize: 12, color: '#3a3a5a' }}>Manage sessions and user accounts</div>
          </div>
          <button
            onClick={() => navigate('/lobby')}
            style={{
              background: 'rgba(255,255,255,0.04)', color: '#6060a0',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
              padding: '8px 18px', fontSize: 13, cursor: 'pointer',
            }}
          >
            ← Lobby
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            background: '#3a1a1a', border: '1px solid #ef4444', borderRadius: 8,
            padding: '10px 14px', color: '#ef4444', marginBottom: 16, fontSize: 13,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{error}</span>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {(['sessions', 'users'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: tab === t ? 'rgba(245,158,11,0.1)' : 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #f59e0b' : '2px solid transparent',
              color: tab === t ? '#f59e0b' : '#4a4a7a',
              padding: '10px 22px', fontSize: 13, fontWeight: tab === t ? 700 : 400,
              cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'capitalize',
            }}>
              {t === 'sessions' ? '🎮 Sessions' : '👥 Users'}
            </button>
          ))}
        </div>

        {/* Sessions tab */}
        {tab === 'sessions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: '#3a3a5a' }}>{sessions.length} sessions in database</span>
              <button onClick={loadSessions} style={{ background: 'transparent', color: '#3a3a6a', border: 'none', cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
            </div>
            <div style={{ background: 'rgba(14,14,36,0.8)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {['ID', 'NAME', 'MODE', 'STATE', 'PLAYERS', 'CREATED', ''].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, color: '#3a3a6a', fontWeight: 700, letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#3a3a6a', fontSize: 13 }}>Loading…</td></tr>}
                  {!loading && sessions.length === 0 && <tr><td colSpan={7} style={{ padding: 28, textAlign: 'center', color: '#2a2a4a', fontSize: 13 }}>No sessions found</td></tr>}
                  {sessions.map(s => {
                    const sc = stateColor(s.state)
                    return (
                      <tr key={s.session_id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#3a3a6a', fontFamily: 'monospace' }}>{s.session_id.slice(0, 8)}…</td>
                        <td style={{ padding: '10px 14px', fontSize: 13, color: '#c0c0e0' }}>{s.name}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: modeColor(s.mode) }}>{s.mode}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: sc.bg, color: sc.color }}>{s.state}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 12, color: '#5050a0' }}>{s.player_count}/{s.max_players}</td>
                        <td style={{ padding: '10px 14px', fontSize: 11, color: '#3a3a5a' }}>{s.created_at.slice(0, 16)}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <button
                            onClick={() => deleteSession(s.session_id)}
                            style={{
                              background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                              border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6,
                              padding: '3px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div>
            {/* Promote form */}
            <div style={{
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 12, padding: '18px 20px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, marginBottom: 12 }}>Grant / Revoke Admin Access</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={promoteEmail}
                  onChange={e => setPromoteEmail(e.target.value)}
                  placeholder="user@email.com"
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '8px 12px', fontSize: 13, color: '#e0e0ff', outline: 'none',
                  }}
                />
                <button
                  onClick={() => { if (promoteEmail) { handlePromote(promoteEmail, true); setPromoteEmail('') } }}
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
                >
                  Make Admin
                </button>
                <button
                  onClick={() => { if (promoteEmail) { handlePromote(promoteEmail, false); setPromoteEmail('') } }}
                  style={{ background: 'rgba(100,100,100,0.1)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
                >
                  Remove Admin
                </button>
              </div>
              {promoteMsg && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 8 }}>{promoteMsg}</div>}
            </div>

            {/* Users table */}
            <div style={{ background: 'rgba(14,14,36,0.8)', border: '1px solid rgba(124,58,237,0.12)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                    {['USERNAME', 'EMAIL', 'ROLE', ''].map(h => (
                      <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, color: '#3a3a6a', fontWeight: 700, letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#3a3a6a', fontSize: 13 }}>Loading…</td></tr>}
                  {users.map(u => (
                    <tr key={u.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 16px', fontSize: 14, color: '#c0c0e0', fontWeight: 600 }}>{u.username}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#5050a0' }}>{u.email}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {u.is_admin
                          ? <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 700 }}>⚙ Admin</span>
                          : <span style={{ fontSize: 11, color: '#3a3a5a' }}>User</span>}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => handlePromote(u.email, !u.is_admin)}
                          style={{
                            background: 'rgba(255,255,255,0.04)', color: '#6060a0',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6,
                            padding: '3px 12px', fontSize: 12, cursor: 'pointer',
                          }}
                        >
                          {u.is_admin ? 'Revoke' : 'Promote'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
