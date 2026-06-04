import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../net/api'

interface SessionSummary {
  session_id:   string
  name:         string
  mode:         string
  state:        string
  player_count: number
  max_players:  number
}

export default function LobbyPage() {
  const navigate  = useNavigate()
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  async function fetchSessions() {
    setLoading(true)
    try {
      const data = await api.listSessions() as SessionSummary[]
      setSessions(data)
    } catch {
      setError('Could not load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSessions() }, [])

  async function handleCreateSolo() {
    try {
      const result = await api.createSession({ mode: 'solo', scenario_id: 'tutorial' }) as SessionSummary
      navigate(`/game/${result.session_id}`)
    } catch (err: any) {
      setError(err.message ?? 'Could not create session')
    }
  }

  async function handleCreateCoop() {
    try {
      const result = await api.createSession({ mode: 'coop', scenario_id: 'tutorial' }) as SessionSummary
      navigate(`/game/${result.session_id}?mode=coop`)
    } catch (err: any) {
      setError(err.message ?? 'Could not create session')
    }
  }

  async function handleJoin(s: SessionSummary) {
    try {
      await api.joinSession(s.session_id)
      const modeParam = s.mode !== 'solo' ? `?mode=${s.mode}` : ''
      navigate(`/game/${s.session_id}${modeParam}`)
    } catch (err: any) {
      setError(err.message ?? 'Could not join session')
    }
  }

  const modeBadge = (mode: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      solo:    { label: 'Solo',    color: '#a855f7', bg: 'rgba(168,85,247,0.1)'  },
      coop:    { label: 'Co-op',   color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
      versus:  { label: 'Versus',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
    }
    const m = map[mode] ?? { label: mode, color: '#aaa', bg: 'rgba(255,255,255,0.05)' }
    return (
      <span style={{
        fontSize: 11, padding: '2px 9px', borderRadius: 99,
        background: m.bg, color: m.color, fontWeight: 700, letterSpacing: '0.05em',
      }}>
        {m.label}
      </span>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a18', color: '#e0e0e0', padding: 32 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            margin: '0 0 6px',
            background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: 28, fontWeight: 800,
          }}>
            ♞ Mage Knight Online
          </h1>
          <p style={{ margin: 0, color: '#4040a0', fontSize: 13 }}>
            Join a quest or begin a new adventure.
          </p>
        </div>

        {/* Create buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
          <button
            onClick={handleCreateSolo}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg,rgba(168,85,247,0.12),rgba(124,58,237,0.06))',
              border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12,
              padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)')}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>🗡</div>
            <div style={{ fontWeight: 700, color: '#c084fc', fontSize: 15, marginBottom: 3 }}>
              Solo Quest
            </div>
            <div style={{ fontSize: 12, color: '#5050a0' }}>
              Explore alone, fight at your own pace
            </div>
          </button>

          <button
            onClick={handleCreateCoop}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg,rgba(6,182,212,0.12),rgba(14,116,144,0.06))',
              border: '1px solid rgba(6,182,212,0.3)', borderRadius: 12,
              padding: '16px 20px', cursor: 'pointer', textAlign: 'left',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.6)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)')}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>⚔</div>
            <div style={{ fontWeight: 700, color: '#06b6d4', fontSize: 15, marginBottom: 3 }}>
              Co-op Quest (2 players)
            </div>
            <div style={{ fontSize: 12, color: '#305060' }}>
              Share a map with a companion — turn-based
            </div>
          </button>
        </div>

        {error && (
          <div style={{
            background: '#3a1a1a', border: '1px solid #ef4444',
            borderRadius: 8, padding: '10px 14px', color: '#ef4444',
            marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Open games list */}
        <div style={{
          background: 'rgba(14,14,36,0.8)', border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3a3a6a', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Open Games
            </span>
            <button
              onClick={fetchSessions}
              style={{
                background: 'transparent', color: '#3a3a6a',
                border: 'none', cursor: 'pointer', fontSize: 12,
              }}
            >
              ↻ Refresh
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                {['NAME', 'MODE', 'PLAYERS', 'STATUS', ''].map(h => (
                  <th key={h} style={{
                    padding: '8px 16px', textAlign: 'left',
                    fontSize: 10, color: '#3a3a6a', fontWeight: 700, letterSpacing: '0.08em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ padding: 28, textAlign: 'center', color: '#3a3a6a', fontSize: 13 }}>
                  Loading…
                </td></tr>
              )}
              {!loading && sessions.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 36, textAlign: 'center', color: '#2a2a4a', fontSize: 13 }}>
                  No open games — create one above to get started!
                </td></tr>
              )}
              {sessions.map(s => {
                const isFull = s.player_count >= s.max_players
                return (
                  <tr key={s.session_id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', fontSize: 14, color: '#c0c0e0' }}>{s.name}</td>
                    <td style={{ padding: '12px 16px' }}>{modeBadge(s.mode)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#5050a0' }}>
                      <span style={{ color: isFull ? '#ef4444' : '#4ade80', fontWeight: 700 }}>
                        {s.player_count}
                      </span>
                      <span style={{ color: '#2a2a4a' }}> / {s.max_players}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                        background: s.state === 'LOBBY' ? 'rgba(74,222,128,0.08)' : 'rgba(245,158,11,0.08)',
                        color: s.state === 'LOBBY' ? '#4ade80' : '#fbbf24',
                      }}>
                        {s.state}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {s.state === 'LOBBY' && !isFull ? (
                        <button
                          onClick={() => handleJoin(s)}
                          style={{
                            background: s.mode === 'coop'
                              ? 'rgba(6,182,212,0.12)'
                              : 'rgba(168,85,247,0.12)',
                            color: s.mode === 'coop' ? '#06b6d4' : '#a855f7',
                            border: `1px solid ${s.mode === 'coop' ? 'rgba(6,182,212,0.3)' : 'rgba(168,85,247,0.3)'}`,
                            borderRadius: 8, padding: '5px 16px',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Join →
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#2a2a4a' }}>
                          {isFull ? 'Full' : s.state}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
