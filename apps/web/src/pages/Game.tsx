import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { HexMap } from '../components/HexMap'
import { CardHand } from '../components/CardHand'
import { CombatModal } from '../components/CombatModal'
import { PlayerHUD } from '../components/PlayerHUD'
import { TutorialModal } from '../components/TutorialModal'
import { useGameStore, setGlobalWsSend } from '../store/gameStore'
import { useGameSocket } from '../net/ws'

// ── Sub-components ────────────────────────────────────────────────────────────

function GameOverScreen() {
  const { fame, level, restartGame } = useGameStore()
  const navigate = useNavigate()
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div className="modal-in" style={{
        background: 'linear-gradient(160deg,#1a0808 0%,#0a0a18 100%)',
        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16,
        padding: 44, textAlign: 'center', color: '#e0e0e0', maxWidth: 380,
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(239,68,68,0.1)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>☠</div>
        <h2 style={{ margin: '0 0 8px', color: '#ef4444', fontSize: 26, fontWeight: 800 }}>Knocked Out!</h2>
        <p style={{ color: '#7070a0', margin: '0 0 28px', fontSize: 14 }}>
          Your wounds filled your hand.<br />The quest ends here.
        </p>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: '#4a4a70', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Final Fame</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#f59e0b' }}>{fame}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div>
            <div style={{ fontSize: 11, color: '#4a4a70', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Level Reached</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#a855f7' }}>{level}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={restartGame} style={{
            background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white',
            border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14,
            fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
          }}>Try Again</button>
          <button onClick={() => navigate('/lobby')} style={{
            background: 'rgba(255,255,255,0.04)', color: '#7070a0',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
            padding: '12px 28px', fontSize: 14, cursor: 'pointer',
          }}>Lobby</button>
        </div>
      </div>
    </div>
  )
}

function WaitingOverlay({ connected }: { connected: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 150,
    }}>
      <div className="modal-in" style={{
        background: 'linear-gradient(160deg,#0e0a24,#080818)',
        border: '1px solid rgba(168,85,247,0.35)', borderRadius: 16,
        padding: '44px 56px', textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(168,85,247,0.08)',
      }}>
        <div style={{ fontSize: 54, marginBottom: 18 }}>⚔</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e0e0ff', marginBottom: 10 }}>Co-op Quest</div>
        <div style={{ fontSize: 14, color: '#6060a0', marginBottom: 28, lineHeight: 1.7 }}>
          {connected ? 'Waiting for your companion to join…' : 'Connecting to server…'}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 9, height: 9, borderRadius: '50%', background: '#7c3aed',
              animation: `pulse-enemy 1.2s ease-in-out ${i * 0.25}s infinite`,
            }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#2a2a4a' }}>
          Share your game URL with a friend to play together
        </div>
      </div>
    </div>
  )
}

function OpponentTurnBanner({ username }: { username: string }) {
  return (
    <div style={{
      position: 'fixed', top: 58, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
      borderRadius: 99, padding: '7px 20px',
      display: 'flex', alignItems: 'center', gap: 10,
      zIndex: 50, backdropFilter: 'blur(8px)', pointerEvents: 'none',
      boxShadow: '0 4px 20px rgba(6,182,212,0.08)',
    }}>
      <div style={{
        width: 7, height: 7, borderRadius: '50%', background: '#06b6d4',
        animation: 'player-glow 1.5s ease-in-out infinite',
      }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#06b6d4', letterSpacing: '0.04em' }}>
        {username}'s turn
      </span>
      <span style={{ fontSize: 11, color: '#304050' }}>— waiting…</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GamePage() {
  const { sessionId }  = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const sessionMode    = (searchParams.get('mode') ?? 'solo') as 'solo' | 'coop'

  const {
    setSession, gameOver, log,
    initMultiplayer, syncOpponent, replaceTiles, handleTurnChanged,
    myPlayerId, currentTurnPlayerId, opponent, mode,
  } = useGameStore()

  const [showTutorial, setShowTutorial] = useState(false)
  const [gameStarted,  setGameStarted]  = useState(sessionMode === 'solo')

  // Stable refs so callbacks don't go stale
  const myPlayerIdRef = useRef<string | null>(null)
  const sendRef       = useRef<(type: string, payload?: Record<string, unknown>) => void>(() => {})

  useEffect(() => { if (sessionId) setSession(sessionId) }, [sessionId])

  // ── WS message handler ──────────────────────────────────────────────────────

  const handleWsMessage = useCallback((frame: any) => {
    const { type } = frame

    if (type === 'session_info') {
      myPlayerIdRef.current = frame.player_id
      // Reconnect: game already started
      if (frame.started && sessionMode === 'coop' && frame.players?.length >= 2) {
        const me  = frame.players.find((p: any) => p.id === frame.player_id)
        const opp = frame.players.find((p: any) => p.id !== frame.player_id)
        if (me && opp) { initMultiplayer(me.id, frame.current_turn, opp); setGameStarted(true) }
      }
    }

    if (type === 'game_start' && sessionMode === 'coop') {
      const myId: string | null = myPlayerIdRef.current
      if (!myId) return
      const players: Array<{ id: string; username: string }> = frame.players ?? []
      const me  = players.find(p => p.id === myId)
      const opp = players.find(p => p.id !== myId)
      if (me && opp) {
        initMultiplayer(myId, frame.current_turn, opp)
        setGameStarted(true)
        // Host (first player in list) shares the game map
        if (myId === players[0].id) {
          const s = useGameStore.getState()
          sendRef.current('full_sync', {
            tiles: s.tiles,
            state: {
              pos: s.playerPos, fame: s.fame, level: s.level,
              wounds: s.wounds, handSizeMax: s.handSizeMax,
              movePoints: s.movePoints, movePointsMax: s.movePointsMax,
              itemCount: s.items.length,
            },
          })
        }
      }
    }

    if (type === 'opponent_state') syncOpponent(frame.from, frame.state, frame.tiles)
    if (type === 'full_sync')     { replaceTiles(frame.tiles); syncOpponent(frame.from, frame.state) }
    if (type === 'turn_changed')  handleTurnChanged(frame.current_turn)
    if (type === 'player_disconnected') {
      useGameStore.getState().addLog(`⚠ ${frame.username ?? 'Companion'} disconnected`)
    }
  }, [sessionMode, initMultiplayer, syncOpponent, replaceTiles, handleTurnChanged])

  const { connected, send } = useGameSocket(sessionId, sessionMode === 'coop', handleWsMessage)

  // Keep sendRef current and wire send to the store
  useEffect(() => {
    sendRef.current = send
    setGlobalWsSend(connected ? send : null)
    return () => { setGlobalWsSend(null) }
  }, [connected, send])

  const isMyTurn   = mode === 'solo' || myPlayerId === currentTurnPlayerId
  const showWaiting = sessionMode === 'coop' && !gameStarted

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden',
    }}>
      <PlayerHUD onTutorial={() => setShowTutorial(true)} />

      <div style={{ flex: 1, display: 'flex', gap: 8, padding: 8, overflow: 'hidden', minHeight: 0 }}>
        <HexMap />

        {/* Action log */}
        <div style={{
          width: 190, background: 'rgba(14,14,36,0.8)',
          border: '1px solid rgba(124,58,237,0.12)', borderRadius: 10,
          padding: 12, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, color: '#2a2a4a', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6,
          }}>Log</div>
          {log.map((entry, i) => (
            <div key={i} className={i === 0 ? 'animate-in' : ''} style={{
              fontSize: 11,
              color: i === 0 ? '#b0b0d0' : '#3a3a5a',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              paddingBottom: 6, lineHeight: 1.5,
            }}>{entry}</div>
          ))}
        </div>
      </div>

      <CardHand />
      <CombatModal />
      {gameOver        && <GameOverScreen />}
      {showTutorial    && <TutorialModal onClose={() => setShowTutorial(false)} />}
      {showWaiting     && <WaitingOverlay connected={connected} />}
      {!showWaiting && mode === 'coop' && !isMyTurn && opponent && (
        <OpponentTurnBanner username={opponent.username} />
      )}
    </div>
  )
}
