import { useGameStore, ItemData } from '../store/gameStore'

const ITEM_VISUALS: Record<string, { emoji: string; bg: string; accent: string }> = {
  health_potion:    { emoji: '🧪', bg: 'linear-gradient(160deg,#042010,#063018)', accent: '#10b981' },
  war_elixir:       { emoji: '⚗️', bg: 'linear-gradient(160deg,#200804,#380c06)', accent: '#ef4444' },
  iron_tonic:       { emoji: '🫙', bg: 'linear-gradient(160deg,#080e20,#0e1830)', accent: '#60a5fa' },
  swift_boots:      { emoji: '👟', bg: 'linear-gradient(160deg,#0a1a08,#0e2610)', accent: '#34d399' },
  mana_crystal:     { emoji: '💠', bg: 'linear-gradient(160deg,#0a0828,#101040)', accent: '#818cf8' },
  rage_stone:       { emoji: '🔴', bg: 'linear-gradient(160deg,#280404,#400606)', accent: '#f43f5e' },
  smoke_bomb:       { emoji: '💨', bg: 'linear-gradient(160deg,#0e0e14,#14141e)', accent: '#94a3b8' },
  dragon_blood:     { emoji: '🩸', bg: 'linear-gradient(160deg,#300608,#500a0e)', accent: '#e11d48' },
  arcane_mirror:    { emoji: '🪞', bg: 'linear-gradient(160deg,#100828,#1a0e40)', accent: '#d946ef' },
  elixir_of_power:  { emoji: '✨', bg: 'linear-gradient(160deg,#1a1004,#2a1a08)', accent: '#fbbf24' },
}

const RARITY_COLOR: Record<string, string> = {
  common:   '#6b7280',
  uncommon: '#3b82f6',
  rare:     '#f59e0b',
}

const FALLBACK_VIS = {
  emoji: '📦', bg: 'linear-gradient(160deg,#0e0e20,#14142e)', accent: '#7c3aed',
}

const CONTEXT_LABEL: Record<string, string> = {
  combat:    'combat only',
  overworld: 'map only',
}

function ItemIcon({
  item, canUse, onUse,
}: { item: ItemData; canUse: boolean; onUse: () => void }) {
  const vis = ITEM_VISUALS[item.defId] ?? FALLBACK_VIS
  const rc  = RARITY_COLOR[item.rarity]

  return (
    <div
      onClick={canUse ? onUse : undefined}
      title={`${item.name}\n${item.desc}${!canUse ? `\n(${CONTEXT_LABEL[item.useIn] ?? ''})` : '\nClick to use'}`}
      style={{
        width: 68, height: 76,
        borderRadius: 12, flexShrink: 0,
        background: vis.bg,
        border: `2px solid ${rc}${canUse ? 'aa' : '28'}`,
        boxShadow: canUse
          ? `0 0 10px ${vis.accent}20, 0 4px 16px rgba(0,0,0,0.65)`
          : '0 2px 8px rgba(0,0,0,0.4)',
        cursor: canUse ? 'pointer' : 'not-allowed',
        opacity: canUse ? 1 : 0.38,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 4,
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        position: 'relative', userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (!canUse) return
        e.currentTarget.style.transform = 'translateY(-5px) scale(1.08)'
        e.currentTarget.style.borderColor = rc
        e.currentTarget.style.boxShadow = `0 0 20px ${vis.accent}50, 0 10px 28px rgba(0,0,0,0.75)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.borderColor = `${rc}${canUse ? 'aa' : '28'}`
        e.currentTarget.style.boxShadow = canUse
          ? `0 0 10px ${vis.accent}20, 0 4px 16px rgba(0,0,0,0.65)`
          : '0 2px 8px rgba(0,0,0,0.4)'
      }}
    >
      {/* Rarity gem */}
      <div style={{
        position: 'absolute', top: 4, right: 4,
        width: 7, height: 7, borderRadius: '50%',
        background: rc, boxShadow: `0 0 5px ${rc}`,
      }} />

      {/* Emoji */}
      <span style={{ fontSize: 26, lineHeight: 1 }}>{vis.emoji}</span>

      {/* Name */}
      <span style={{
        fontSize: 7.5, fontWeight: 600,
        color: canUse ? '#8888b0' : '#404058',
        textAlign: 'center', lineHeight: 1.25,
        padding: '0 4px', maxWidth: 64,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {item.name}
      </span>

      {/* Context badge when item can't be used here */}
      {!canUse && item.useIn !== 'any' && (
        <div style={{
          position: 'absolute', bottom: -8, left: '50%',
          transform: 'translateX(-50%)',
          background: '#10101c', border: '1px solid #1e1e2e',
          borderRadius: 4, padding: '1px 5px',
          fontSize: 7, color: '#30304a', whiteSpace: 'nowrap',
        }}>
          {CONTEXT_LABEL[item.useIn]}
        </div>
      )}
    </div>
  )
}

export function ItemBag({ context }: { context: 'combat' | 'overworld' }) {
  const { items, useItem } = useGameStore()
  if (items.length === 0) return null

  const sorted = [
    ...items.filter(i => i.useIn === 'any' || i.useIn === context),
    ...items.filter(i => i.useIn !== 'any' && i.useIn !== context),
  ]

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#4040a0',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          Items
        </span>
        <span style={{
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 99, padding: '1px 9px', fontSize: 11, color: '#f59e0b',
        }}>
          {items.length}
        </span>
        <span style={{ fontSize: 10, color: '#2a2a4a' }}>
          · click to use
        </span>
      </div>

      {/* Item icons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {sorted.map(item => {
          const canUse = item.useIn === 'any' || item.useIn === context
          return (
            <ItemIcon
              key={item.id}
              item={item}
              canUse={canUse}
              onUse={() => useItem(item.id)}
            />
          )
        })}
      </div>
    </div>
  )
}

/** Compact version for the combat result screen — shows a single item */
export function ItemDropDisplay({ item }: { item: ItemData }) {
  const vis = ITEM_VISUALS[item.defId] ?? FALLBACK_VIS
  const rc  = RARITY_COLOR[item.rarity]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      background: 'rgba(245,158,11,0.05)',
      border: '1px solid rgba(245,158,11,0.15)',
      borderRadius: 12, padding: '12px 16px',
    }}>
      {/* Icon */}
      <div style={{
        width: 52, height: 52, borderRadius: 10, flexShrink: 0,
        background: vis.bg,
        border: `2px solid ${rc}80`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26,
        boxShadow: `0 0 12px ${vis.accent}25`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 3, right: 3,
          width: 7, height: 7, borderRadius: '50%',
          background: rc, boxShadow: `0 0 5px ${rc}`,
        }} />
        {vis.emoji}
      </div>

      {/* Info */}
      <div>
        <div style={{ fontSize: 9, fontWeight: 800, color: vis.accent, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
          {item.rarity} item
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#dde0ff', marginBottom: 3 }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11, color: '#5050a0', fontStyle: 'italic' }}>
          {item.desc}
        </div>
      </div>

      {/* Added badge */}
      <div style={{
        marginLeft: 'auto', flexShrink: 0,
        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 6, padding: '4px 10px',
        fontSize: 10, color: '#f59e0b', fontWeight: 700,
      }}>
        + Added
      </div>
    </div>
  )
}
