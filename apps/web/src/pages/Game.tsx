import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { HexMap } from '../components/HexMap'
import { CardHand } from '../components/CardHand'
import { CombatModal } from '../components/CombatModal'
import { PlayerHUD } from '../components/PlayerHUD'
import { TutorialModal } from '../components/TutorialModal'
import { useGameStore } from '../store/gameStore'

function GameOverScreen() {
  const { fame, level, restartGame } = useGameStore()
  const navigate = useNavigate()
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200,
    }}>
      <div
        className="modal-in"
        style={{
          background: 'linear-gradient(160deg, #1a0808 0%, #0a0a18 100%)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 16,
          padding: 44,
          textAlign: 'center',
          color: '#e0e0e0',
          maxWidth: 380,
          boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 60px rgba(239,68,68,0.1)',
        }}
      >
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
          <button
            onClick={restartGame}
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
              color: 'white', border: 'none', borderRadius: 10,
              padding: '12px 28px', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/lobby')}
            style={{
              background: 'rgba(255,255,255,0.04)',
              color: '#7070a0', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, padding: '12px 28px', fontSize: 14, cursor: 'pointer',
            }}
          >
            Lobby
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GamePage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { setSession, gameOver, log } = useGameStore()
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (sessionId) setSession(sessionId)
  }, [sessionId])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg)',
      color: 'var(--text)',
      overflow: 'hidden',
    }}>
      <PlayerHUD onTutorial={() => setShowTutorial(true)} />

      <div style={{ flex: 1, display: 'flex', gap: 8, padding: 8, overflow: 'hidden', minHeight: 0 }}>
        <HexMap />

        {/* Action log */}
        <div style={{
          width: 190,
          background: 'rgba(14,14,36,0.8)',
          border: '1px solid rgba(124,58,237,0.12)',
          borderRadius: 10,
          padding: 12,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: '#2a2a4a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Log
          </div>
          {log.map((entry, i) => (
            <div
              key={i}
              className={i === 0 ? 'animate-in' : ''}
              style={{
                fontSize: 11,
                color: i === 0 ? '#b0b0d0' : '#3a3a5a',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                paddingBottom: 6,
                lineHeight: 1.5,
              }}
            >
              {entry}
            </div>
          ))}
        </div>
      </div>

      <CardHand />
      <CombatModal />
      {gameOver && <GameOverScreen />}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}
    </div>
  )
}
