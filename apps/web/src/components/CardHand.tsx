import { useGameStore } from '../store/gameStore'

const CARD_STYLE: Record<string, { bg: string; glow: string; icon: string }> = {
  march:            { bg: 'linear-gradient(145deg,#0f2a14,#1a3d20)', glow: '#10b981', icon: '👣' },
  rage:             { bg: 'linear-gradient(145deg,#2a0a0a,#3d1414)', glow: '#ef4444', icon: '⚔' },
  determination:    { bg: 'linear-gradient(145deg,#0a142a,#14203d)', glow: '#3b82f6', icon: '🛡' },
  concentration:    { bg: 'linear-gradient(145deg,#18082e,#24104a)', glow: '#a855f7', icon: '✦' },
  swiftness:        { bg: 'linear-gradient(145deg,#082a1e,#103d2e)', glow: '#34d399', icon: '💨' },
  promise:          { bg: 'linear-gradient(145deg,#0a1e2a,#14303d)', glow: '#60a5fa', icon: '🛡' },
  improvisation:    { bg: 'linear-gradient(145deg,#1e1a08,#2e2810)', glow: '#fbbf24', icon: '✦' },
  threatening_aura: { bg: 'linear-gradient(145deg,#2a0814,#3d1020)', glow: '#f43f5e', icon: '☠' },
}

export function CardHand() {
  const { hand, discard, combat, gameOver, endTurn } = useGameStore()

  if (combat || gameOver) return null

  return (
    <div style={{
      background: 'linear-gradient(180deg, #0c0c20 0%, #0a0a18 100%)',
      borderTop: '1px solid rgba(124,58,237,0.2)',
      padding: '12px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      flexShrink: 0,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
    }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#5050a0', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Hand
          </span>
          <span style={{
            background: 'rgba(168,85,247,0.15)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 99,
            padding: '1px 8px',
            fontSize: 11,
            color: '#a855f7',
          }}>
            {hand.length} cards
          </span>
          <span style={{ fontSize: 11, color: '#333360' }}>
            {discard.length} in draw pile
          </span>
        </div>
        <button
          onClick={endTurn}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '6px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
            letterSpacing: '0.03em',
            transition: 'opacity 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
        >
          End Turn →
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {hand.map(card => {
          const style = CARD_STYLE[card.defId] ?? { bg: 'linear-gradient(145deg,#12122a,#1c1c3a)', glow: '#7c3aed', icon: '✦' }
          return (
            <div
              key={card.instanceId}
              style={{
                background: style.bg,
                border: `1px solid ${style.glow}33`,
                borderRadius: 10,
                padding: '10px 12px',
                minWidth: 90,
                maxWidth: 110,
                cursor: 'default',
                userSelect: 'none',
                boxShadow: `0 2px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Glow top border */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: 2,
                background: `linear-gradient(90deg, transparent, ${style.glow}, transparent)`,
                opacity: 0.7,
              }} />

              <div style={{ fontSize: 18, marginBottom: 6 }}>{style.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 12, color: '#e0e0f8', marginBottom: 6, lineHeight: 1.2 }}>
                {card.name}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {card.attack > 0 && (
                  <span style={{
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 4, padding: '1px 5px', fontSize: 11, color: '#f87171', fontWeight: 700,
                  }}>
                    ⚔ {card.attack}
                  </span>
                )}
                {card.block > 0 && (
                  <span style={{
                    background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 4, padding: '1px 5px', fontSize: 11, color: '#60a5fa', fontWeight: 700,
                  }}>
                    🛡 {card.block}
                  </span>
                )}
                {card.move > 0 && (
                  <span style={{
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 4, padding: '1px 5px', fontSize: 11, color: '#34d399', fontWeight: 700,
                  }}>
                    👣 {card.move}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {hand.length === 0 && (
          <div style={{
            padding: '12px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 10,
            color: '#3a3a60',
            fontSize: 13,
          }}>
            Hand empty — click End Turn →
          </div>
        )}
      </div>
    </div>
  )
}
