import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { HexMap } from '../components/HexMap'
import { CardHand } from '../components/CardHand'
import { CombatModal } from '../components/CombatModal'
import { PlayerHUD } from '../components/PlayerHUD'
import { TutorialModal } from '../components/TutorialModal'
import { useGameStore } from '../store/gameStore'
import { PvpChallengeScreen, PvpPickModal, PvpResultModal } from '../components/PvpModal'

// ── Game Over ─────────────────────────────────────────────────────────────────

function GameOverScreen() {
  const { fame, level, restartGame, mode, activeSeat, localSeatNames } = useGameStore()
  const navigate  = useNavigate()
  const seatLabel = mode === 'local' ? `${localSeatNames[activeSeat - 1]} — ` : ''
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200,
    }}>
      <div className="modal-in" style={{
        background: 'linear-gradient(160deg,#1a0808 0%,#0a0a18 100%)',
        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16,
        padding: 44, textAlign: 'center', color: '#e0e0e0', maxWidth: 380,
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>☠</div>
        <h2 style={{ margin: '0 0 8px', color: '#ef4444', fontSize: 26, fontWeight: 800 }}>
          {seatLabel}Knocked Out!
        </h2>
        <p style={{ color: '#7070a0', margin: '0 0 28px', fontSize: 14 }}>
          {mode === 'local'
            ? 'Their wounds filled their hand. Pass to the other player to continue.'
            : 'Your wounds filled your hand. The quest ends here.'}
        </p>
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, color: '#4a4a70', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Final Fame</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#f59e0b' }}>{fame}</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div>
            <div style={{ fontSize: 11, color: '#4a4a70', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Level</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: '#a855f7' }}>{level}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={restartGame} style={{
            background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white',
            border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14,
            fontWeight: 700, cursor: 'pointer',
          }}>New Game</button>
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

// ── Local co-op overlays ──────────────────────────────────────────────────────

function LocalSetupOverlay({ onStart, isPvp }: { onStart: (n1: string, n2: string) => void; isPvp: boolean }) {
  const [n1, setN1] = useState('Player 1')
  const [n2, setN2] = useState('Player 2')
  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: 8, padding: '10px 14px', fontSize: 15, color: '#e0e0ff',
    width: '100%', outline: 'none', boxSizing: 'border-box',
  }
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
      backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 200,
    }}>
      <div className="modal-in" style={{
        background: 'linear-gradient(160deg,#12102a,#0a0a1a)',
        border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16,
        padding: '44px 48px', textAlign: 'center', maxWidth: 380,
        boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>{isPvp ? '⚔🔥⚔' : '🛡⚔🛡'}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e0e0ff', marginBottom: 6 }}>{isPvp ? 'Local PvP' : 'Local Co-op'}</div>
        <div style={{ fontSize: 13, color: '#5050a0', marginBottom: 28 }}>
          {isPvp ? 'Explore, grow stronger, then challenge each other to a duel!' : 'Two knights, one screen — take turns passing the device.'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, textAlign: 'left' }}>
          <div>
            <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>♞ PLAYER 1 NAME</div>
            <input value={n1} onChange={e => setN1(e.target.value)} style={inp} maxLength={20} placeholder="Player 1" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#06b6d4', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>♘ PLAYER 2 NAME</div>
            <input value={n2} onChange={e => setN2(e.target.value)} style={inp} maxLength={20} placeholder="Player 2" />
          </div>
        </div>
        <button
          onClick={() => onStart(n1.trim() || 'Player 1', n2.trim() || 'Player 2')}
          style={{
            width: '100%', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 4px 24px rgba(124,58,237,0.5)', letterSpacing: '0.04em',
          }}
        >Begin Quest →</button>
      </div>
    </div>
  )
}

type PvpPhase = import('../store/gameStore').PvpCombat['phase'] | null

function PassDeviceOverlay({ seat, name, pvpPhase, onReady }: {
  seat: 1 | 2; name: string; pvpPhase: PvpPhase; onReady: () => void
}) {
  const color = seat === 1 ? '#a855f7' : '#06b6d4'
  const icon  = seat === 1 ? '♞' : '♘'

  // Context-sensitive messaging for PvP mid-turn handoffs
  const { label, sub } = pvpPhase === 'DEFENDER_RESPONDS'
    ? { label: 'Duel Challenge!',  sub: 'You have been challenged — read the offer carefully.' }
    : pvpPhase === 'CHALLENGER_PICKS'
    ? { label: 'Your Pick!',       sub: 'Choose your attack & block cards — keep them secret.' }
    : pvpPhase === 'DEFENDER_PICKS'
    ? { label: 'Your Turn to Pick!', sub: 'Challenger has locked in — now choose your cards.' }
    : { label: `${name}'s Turn`, sub: "Make sure the other player isn't watching!" }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#020210', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div className="modal-in" style={{ textAlign: 'center', maxWidth: 340, padding: '0 24px' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: `radial-gradient(circle,${color}40,${color}10)`,
          border: `2px solid ${color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 24px', boxShadow: `0 0 40px ${color}28`,
        }}>{pvpPhase ? '⚔' : icon}</div>
        <div style={{ fontSize: 12, color: pvpPhase ? '#ef4444' : '#3a3a6a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
          Hand to {name}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#e0e0ff', marginBottom: 10 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#4a4a7a', marginBottom: 36, lineHeight: 1.7 }}>
          {sub}
        </div>
        <button
          onClick={onReady}
          style={{
            background: pvpPhase
              ? 'linear-gradient(135deg,#dc2626,#991b1b)'
              : `linear-gradient(135deg,${color},${color}90)`,
            color: 'white', border: 'none', borderRadius: 12,
            padding: '16px 52px', fontSize: 16, fontWeight: 800,
            cursor: 'pointer', letterSpacing: '0.04em',
            boxShadow: pvpPhase ? '0 4px 24px rgba(220,38,38,0.45)' : `0 4px 24px ${color}45`,
          }}
        >I'm Ready →</button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GamePage() {
  const { sessionId }  = useParams<{ sessionId: string }>()
  const [searchParams] = useSearchParams()
  const isLocal        = searchParams.get('mode') === 'local'

  const {
    setSession, gameOver, log,
    initLocalCoop, initLocalPvp, confirmHandoff,
    mode, localSubMode, pendingHandoff, activeSeat, localSeatNames,
    pvpCombat, challengeCooldown, issueChallenge,
  } = useGameStore()

  const [showTutorial,   setShowTutorial]   = useState(false)
  const [localSetupDone, setLocalSetupDone] = useState(!isLocal)
  const isPvp = searchParams.get('sub') === 'pvp'

  useEffect(() => {
    if (sessionId && !isLocal) setSession(sessionId)
  }, [sessionId, isLocal])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: 'var(--bg)', color: 'var(--text)', overflow: 'hidden',
    }}>
      <PlayerHUD onTutorial={() => setShowTutorial(true)} />

      <div style={{ flex: 1, display: 'flex', gap: 8, padding: 8, overflow: 'hidden', minHeight: 0 }}>
        <HexMap />
        <div style={{
          width: 190, background: 'rgba(14,14,36,0.8)',
          border: '1px solid rgba(124,58,237,0.12)', borderRadius: 10,
          padding: 12, overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: '#2a2a4a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Log</div>
          {log.map((entry, i) => (
            <div key={i} className={i === 0 ? 'animate-in' : ''} style={{
              fontSize: 11, color: i === 0 ? '#b0b0d0' : '#3a3a5a',
              borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 6, lineHeight: 1.5,
            }}>{entry}</div>
          ))}
        </div>
      </div>

      <CardHand />
      <CombatModal />

      {gameOver && <GameOverScreen />}
      {showTutorial && <TutorialModal onClose={() => setShowTutorial(false)} />}

      {/* Local setup overlay */}
      {isLocal && !localSetupDone && (
        <LocalSetupOverlay
          isPvp={isPvp}
          onStart={(n1, n2) => {
            if (isPvp) initLocalPvp(n1, n2)
            else initLocalCoop(n1, n2)
            setLocalSetupDone(true)
          }}
        />
      )}

      {/* PvP challenge button (shown during PvP turns, not during handoff or combat) */}
      {mode === 'local' && localSubMode === 'pvp' && !pendingHandoff && !pvpCombat && (
        <div style={{ position: 'fixed', bottom: 160, right: 16, zIndex: 50 }}>
          <button
            onClick={issueChallenge}
            disabled={challengeCooldown > 0}
            style={{
              background: challengeCooldown > 0 ? 'rgba(100,100,100,0.12)' : 'linear-gradient(135deg,#dc2626,#991b1b)',
              color: challengeCooldown > 0 ? '#4a4a6a' : 'white',
              border: `1px solid ${challengeCooldown > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(220,38,38,0.5)'}`,
              borderRadius: 12, padding: '10px 16px', cursor: challengeCooldown > 0 ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
              boxShadow: challengeCooldown > 0 ? 'none' : '0 4px 20px rgba(220,38,38,0.4)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <span>⚔</span>
            <span>{challengeCooldown > 0 ? `Duel (${challengeCooldown})` : 'Challenge!'}</span>
          </button>
        </div>
      )}

      {/* PvP modals */}
      <PvpChallengeScreen />
      <PvpPickModal />
      <PvpResultModal />
      {mode === 'local' && pendingHandoff && (
        <PassDeviceOverlay
          seat={activeSeat}
          name={localSeatNames[activeSeat - 1]}
          pvpPhase={pvpCombat?.phase ?? null}
          onReady={confirmHandoff}
        />
      )}
    </div>
  )
}
