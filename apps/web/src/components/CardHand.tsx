import { useGameStore } from '../store/gameStore'
import { CardDisplay } from './CardDisplay'
import { ItemBag } from './ItemBag'

export function CardHand() {
  const { hand, discard, combat, gameOver, endTurn, items } = useGameStore()
  if (combat || gameOver) return null

  const hasItems = items.length > 0

  return (
    <div style={{
      background: 'linear-gradient(180deg,#0c0c1e 0%,#08081a 100%)',
      borderTop: '1px solid rgba(124,58,237,0.18)',
      padding: '12px 16px 14px',
      flexShrink: 0,
      boxShadow: '0 -8px 32px rgba(0,0,0,0.55)',
    }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#4040a0',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            Hand
          </span>
          <span style={{
            background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.22)',
            borderRadius: 99, padding: '1px 10px', fontSize: 11, color: '#a855f7',
          }}>
            {hand.length}
          </span>
          <span style={{ fontSize: 11, color: '#28285a' }}>· {discard.length} in discard</span>
        </div>

        <button
          onClick={endTurn}
          style={{
            background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
            color: 'white', border: 'none', borderRadius: 8,
            padding: '7px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.03em',
            boxShadow: '0 2px 16px rgba(124,58,237,0.45)',
            transition: 'opacity 0.15s, transform 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'none' }}
        >
          End Turn →
        </button>
      </div>

      {/* ── Cards + Items row ── */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Cards */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {hand.map(card => (
              <CardDisplay key={card.instanceId} card={card} />
            ))}
            {hand.length === 0 && (
              <div style={{
                border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 12,
                padding: '18px 28px', color: '#2a2a50', fontSize: 13,
                whiteSpace: 'nowrap', alignSelf: 'center',
              }}>
                Hand empty — End Turn to draw
              </div>
            )}
          </div>
        </div>

        {/* Items panel — only shown when player has items */}
        {hasItems && (
          <>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.05)', alignSelf: 'stretch' }} />
            <div style={{ flexShrink: 0, maxWidth: 280 }}>
              <ItemBag context="overworld" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
