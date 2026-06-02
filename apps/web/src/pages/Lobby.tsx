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

  async function handleCreate() {
    try {
      const result = await api.createSession({ mode: 'solo', scenario_id: 'tutorial' }) as SessionSummary
      navigate(`/game/${result.session_id}`)
    } catch (err: any) {
      setError(err.message ?? 'Could not create session')
    }
  }

  async function handleJoin(sessionId: string) {
    try {
      await api.joinSession(sessionId)
      navigate(`/game/${sessionId}`)
    } catch (err: any) {
      setError(err.message ?? 'Could not join session')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f0f1a',
      color: '#e0e0e0',
      padding: 32,
    }}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, color: '#7b5ea7' }}>⚔ Game Lobby</h1>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
              Join an existing game or create a new one.
            </p>
          </div>
          <button
            onClick={handleCreate}
            style={{
              background: '#7b5ea7',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            + New Solo Game
          </button>
        </div>

        {error && (
          <div style={{
            background: '#3a1a1a', border: '1px solid #ef4444',
            borderRadius: 6, padding: '10px 14px', color: '#ef4444',
            marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <div style={{
          background: '#16213e',
          border: '1px solid #2a2a4a',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2a4a', background: '#0f0f1a' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#666' }}>NAME</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#666' }}>MODE</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#666' }}>PLAYERS</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#666' }}>STATE</th>
                <th style={{ padding: '10px 16px' }}></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#666' }}>Loading…</td></tr>
              )}
              {!loading && sessions.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#555' }}>
                    No open games. Click <strong style={{ color: '#7b5ea7' }}>+ New Solo Game</strong> to start one!
                  </td>
                </tr>
              )}
              {sessions.map(s => (
                <tr key={s.session_id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                  <td style={{ padding: '12px 16px', fontSize: 14 }}>{s.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#aaa', textTransform: 'capitalize' }}>{s.mode}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#aaa' }}>
                    {s.player_count} / {s.max_players}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: s.state === 'LOBBY' ? '#1b4332' : '#3a2a1a',
                      color: s.state === 'LOBBY' ? '#4ade80' : '#fbbf24',
                    }}>
                      {s.state}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleJoin(s.session_id)}
                      style={{
                        background: '#2a2a4a',
                        color: '#e0e0e0',
                        border: '1px solid #7b5ea7',
                        borderRadius: 6,
                        padding: '4px 14px',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      Join →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 12, textAlign: 'right' }}>
          <button
            onClick={fetchSessions}
            style={{
              background: 'transparent', color: '#666',
              border: 'none', cursor: 'pointer', fontSize: 12,
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>
    </div>
  )
}
