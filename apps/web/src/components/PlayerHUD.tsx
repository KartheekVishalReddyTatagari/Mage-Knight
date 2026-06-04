import { useGameStore, OpponentState } from '../store/gameStore'

const FAME_THRESHOLDS = [0, 3, 8, 14, 21, 30, 40]

interface Props { onTutorial: () => void }

function fameProgress(fame: number, level: number) {
  const nextTh = FAME_THRESHOLDS[level] ?? FAME_THRESHOLDS[FAME_THRESHOLDS.length - 1]
  const prevTh = FAME_THRESHOLDS[level - 1] ?? 0
  return nextTh > prevTh ? Math.min(((fame - prevTh) / (nextTh - prevTh)) * 100, 100) : 100
}

function PlayerPanel({
  label, accent, fame, level, wounds, handSizeMax, isMe,
}: {
  label: string; accent: string; fame: number; level: number
  wounds: number; handSizeMax: number; isMe: boolean
}) {
  const progress   = fameProgress(fame, level)
  const isMaxLevel = level >= 7
  const nextTh     = FAME_THRESHOLDS[level] ?? FAME_THRESHOLDS[FAME_THRESHOLDS.length - 1]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '4px 14px',
      borderRadius: 10,
      background: isMe ? 'rgba(124,58,237,0.06)' : 'rgba(6,182,212,0.06)',
      border: `1px solid ${isMe ? 'rgba(124,58,237,0.15)' : 'rgba(6,182,212,0.15)'}`,
    }}>
      {/* Name / label */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: accent,
        letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
      }}>
        {label}
      </div>

      {/* Level badge */}
      <div style={{
        background: isMe ? 'linear-gradient(135deg,#7c3aed,#4c1d95)' : 'linear-gradient(135deg,#0e7490,#155e75)',
        borderRadius: 6, padding: '2px 8px',
        fontSize: 11, fontWeight: 700, color: 'white', whiteSpace: 'nowrap',
      }}>
        LVL {level}
      </div>

      {/* Fame bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#4a4a7a' }}>
          <span>FAME</span>
          <span style={{ color: '#f59e0b' }}>{fame}{!isMaxLevel && ` / ${nextTh}`}</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${isMaxLevel ? 100 : progress}%`,
            background: 'linear-gradient(90deg,#d97706,#f59e0b,#fcd34d)',
            borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: '0 0 6px rgba(245,158,11,0.5)',
          }} />
        </div>
      </div>

      {/* Wound dots */}
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: Math.min(handSizeMax, 8) }).map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%',
            background: i < wounds
              ? 'radial-gradient(circle,#ff6b6b,#ef4444)'
              : 'rgba(255,255,255,0.06)',
            border: `1px solid ${i < wounds ? '#ef4444' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: i < wounds ? '0 0 4px rgba(239,68,68,0.5)' : 'none',
          }} />
        ))}
      </div>
    </div>
  )
}

export function PlayerHUD({ onTutorial }: Props) {
  const {
    fame, level, wounds, handSizeMax, playerPos, log,
    mode, opponent, myPlayerId, currentTurnPlayerId,
  } = useGameStore()

  const isMyTurn    = mode === 'solo' || myPlayerId === currentTurnPlayerId
  const isCoop      = mode === 'coop'
  const myUsername  = 'You'
  const oppUsername = opponent?.username ?? 'Companion'

  return (
    <div style={{
      background: 'linear-gradient(180deg,#12122a 0%,#0e0e20 100%)',
      borderBottom: '1px solid rgba(124,58,237,0.25)',
      padding: '6px 14px',
      display: 'flex', alignItems: 'center', gap: 14,
      flexShrink: 0,
      boxShadow: '0 2px 20px rgba(0,0,0,0.4)',
      minHeight: 52,
    }}>
      {/* Brand */}
      <div style={{
        fontWeight: 800, fontSize: 14,
        background: 'linear-gradient(135deg,#a855f7,#7c3aed)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        ♞ MK
      </div>

      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {isCoop ? (
        /* ── Co-op: show both players side by side ── */
        <>
          <div style={{ position: 'relative' }}>
            <PlayerPanel
              label={myUsername} accent="#a855f7"
              fame={fame} level={level} wounds={wounds} handSizeMax={handSizeMax}
              isMe
            />
            {/* MY TURN indicator */}
            {isMyTurn && (
              <div style={{
                position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(168,85,247,0.9)', borderRadius: 99,
                padding: '1px 8px', fontSize: 8, fontWeight: 800,
                color: 'white', letterSpacing: '0.08em', whiteSpace: 'nowrap',
              }}>
                YOUR TURN
              </div>
            )}
          </div>

          <div style={{ fontSize: 18, color: '#2a2a4a', flexShrink: 0 }}>vs</div>

          {opponent ? (
            <div style={{ position: 'relative' }}>
              <PlayerPanel
                label={oppUsername} accent="#06b6d4"
                fame={opponent.fame} level={opponent.level}
                wounds={opponent.wounds} handSizeMax={opponent.handSizeMax}
                isMe={false}
              />
              {/* THEIR TURN indicator */}
              {!isMyTurn && (
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(6,182,212,0.9)', borderRadius: 99,
                  padding: '1px 8px', fontSize: 8, fontWeight: 800,
                  color: 'white', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>
                  THEIR TURN
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: '#2a2a4a' }}>Waiting for companion…</div>
          )}
        </>
      ) : (
        /* ── Solo: original layout ── */
        <>
          {/* Level badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              background: 'linear-gradient(135deg,#7c3aed,#4c1d95)',
              borderRadius: 8, padding: '3px 10px', fontSize: 12,
              fontWeight: 700, color: 'white', letterSpacing: '0.05em',
              boxShadow: '0 2px 8px rgba(124,58,237,0.5)',
            }}>
              LVL {level}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 130 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#7070a0' }}>
                <span>FAME</span>
                <span style={{ color: '#f59e0b' }}>
                  {fame}{level < 7 && ` / ${FAME_THRESHOLDS[level]}`}
                </span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${level >= 7 ? 100 : fameProgress(fame, level)}%`,
                  background: 'linear-gradient(90deg,#d97706,#f59e0b,#fcd34d)',
                  borderRadius: 99, transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: '0 0 8px rgba(245,158,11,0.6)',
                }} />
              </div>
            </div>
          </div>

          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)' }} />

          {/* Wounds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div style={{ fontSize: 10, color: '#7070a0', letterSpacing: '0.05em' }}>WOUNDS</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: handSizeMax }).map((_, i) => (
                <div key={i} className={i < wounds ? 'pulse-enemy' : ''} style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: i < wounds
                    ? 'radial-gradient(circle,#ff6b6b,#ef4444)'
                    : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${i < wounds ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: i < wounds ? '0 0 6px rgba(239,68,68,0.5)' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }} />
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Latest log entry */}
      <div style={{
        flex: 1, fontSize: 12, color: '#8080a8',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        padding: '0 4px',
      }}>
        {log[0]}
      </div>

      {/* Coord (solo only) */}
      {!isCoop && (
        <div style={{ fontSize: 11, color: '#3a3a5a', whiteSpace: 'nowrap' }}>
          ({playerPos.q},{playerPos.r})
        </div>
      )}

      {/* Tutorial button */}
      <button
        onClick={onTutorial}
        title="How to Play"
        style={{
          background: 'rgba(168,85,247,0.12)',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 8, color: '#a855f7',
          width: 30, height: 30, fontSize: 15, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.25)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(168,85,247,0.12)' }}
      >
        ?
      </button>
    </div>
  )
}
