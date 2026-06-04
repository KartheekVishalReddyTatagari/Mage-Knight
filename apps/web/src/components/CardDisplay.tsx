import { CardData } from '../store/gameStore'

export interface CardArt {
  emoji: string
  bg: string
  accent: string
  label: string
  rarity: 'common' | 'uncommon' | 'rare'
  desc: string
}

export const RARITY_COLOR: Record<string, string> = {
  common:   '#6b7280',
  uncommon: '#3b82f6',
  rare:     '#f59e0b',
}

export const CARD_ART: Record<string, CardArt> = {
  // ─── Starting deck ──────────────────────────────────────────────────────────
  rage:              { emoji:'🔥', bg:'linear-gradient(160deg,#2a0808,#4a0e0e)', accent:'#ef4444', label:'ATTACK',  rarity:'common',   desc:'Channel fury into your blade.' },
  determination:     { emoji:'🛡️', bg:'linear-gradient(160deg,#080e20,#0e1a3d)', accent:'#3b82f6', label:'BLOCK',   rarity:'common',   desc:'Stand firm against any blow.' },
  concentration:     { emoji:'💎', bg:'linear-gradient(160deg,#180a2e,#280e50)', accent:'#a855f7', label:'UTILITY', rarity:'common',   desc:'Focus turns raw strength to precision.' },
  battle_cry:        { emoji:'⚔️', bg:'linear-gradient(160deg,#220808,#380e0e)', accent:'#f97316', label:'ATTACK',  rarity:'common',   desc:'Strike with battle-hardened conviction.' },
  shield_wall:       { emoji:'🏰', bg:'linear-gradient(160deg,#081828,#0e2440)', accent:'#60a5fa', label:'BLOCK',   rarity:'common',   desc:'Cover every angle of approach.' },
  improvisation:     { emoji:'🎲', bg:'linear-gradient(160deg,#1e1504,#302008)', accent:'#f59e0b', label:'UTILITY', rarity:'common',   desc:'Adapt to the chaos of battle.' },
  cold_toughness:    { emoji:'❄️', bg:'linear-gradient(160deg,#041020,#081830)', accent:'#67e8f9', label:'BLOCK',   rarity:'common',   desc:'Endure the biting cold within.' },
  // ─── Uncommon loot ──────────────────────────────────────────────────────────
  threatening_aura:   { emoji:'💀', bg:'linear-gradient(160deg,#200408,#3a0810)', accent:'#f43f5e', label:'ATTACK',  rarity:'uncommon', desc:'Fear itself becomes your weapon.' },
  battle_versatility: { emoji:'⚖️', bg:'linear-gradient(160deg,#1a0e20,#280f38)', accent:'#c084fc', label:'UTILITY', rarity:'uncommon', desc:'Master of offense and defense alike.' },
  iron_will:          { emoji:'🔒', bg:'linear-gradient(160deg,#0a1220,#101e38)', accent:'#38bdf8', label:'BLOCK',   rarity:'uncommon', desc:'Unyielding. Unbreakable. Unmovable.' },
  parry:              { emoji:'🗡️', bg:'linear-gradient(160deg,#0e1820,#18283a)', accent:'#22d3ee', label:'BLOCK',   rarity:'uncommon', desc:'Deflect with grace, then counter.' },
  savage_strike:      { emoji:'💢', bg:'linear-gradient(160deg,#280808,#420e0e)', accent:'#dc2626', label:'ATTACK',  rarity:'uncommon', desc:'Overwhelming, devastating force.' },
  bladestorm:         { emoji:'🌪️', bg:'linear-gradient(160deg,#200a10,#380e18)', accent:'#fb7185', label:'ATTACK',  rarity:'uncommon', desc:'A whirlwind of steel and fury.' },
  war_cry:            { emoji:'📯', bg:'linear-gradient(160deg,#1e0c04,#300f08)', accent:'#fb923c', label:'ATTACK',  rarity:'uncommon', desc:'Rally your spirit for war.' },
  shield_bash:        { emoji:'🛡️', bg:'linear-gradient(160deg,#060e28,#0a1840)', accent:'#818cf8', label:'BLOCK',   rarity:'uncommon', desc:'Block with force, then smash them.' },
  promise:            { emoji:'🌊', bg:'linear-gradient(160deg,#040c28,#081440)', accent:'#60a5fa', label:'BLOCK',   rarity:'uncommon', desc:'A vow carved into your shield.' },
  // ─── Rare loot ──────────────────────────────────────────────────────────────
  tranquility:        { emoji:'💚', bg:'linear-gradient(160deg,#041808,#082818)', accent:'#10b981', label:'HEAL',    rarity:'rare',     desc:'Restore body and soul. Removes a wound.' },
  heroic_tale:        { emoji:'📖', bg:'linear-gradient(160deg,#1a1004,#281808)', accent:'#fbbf24', label:'UTILITY', rarity:'rare',     desc:'Your legend grows with every deed.' },
  blood_rage:         { emoji:'🩸', bg:'linear-gradient(160deg,#300408,#500810)', accent:'#e11d48', label:'ATTACK',  rarity:'rare',     desc:'Pain becomes unstoppable fury.' },
  arcane_shield:      { emoji:'🔮', bg:'linear-gradient(160deg,#100830,#1a0e50)', accent:'#d946ef', label:'BLOCK',   rarity:'rare',     desc:'A barrier of pure arcane will.' },
  lightning_bolt:     { emoji:'⚡', bg:'linear-gradient(160deg,#101004,#201c08)', accent:'#facc15', label:'ATTACK',  rarity:'rare',     desc:'Arcane devastation from the heavens.' },
  nova_blast:         { emoji:'💥', bg:'linear-gradient(160deg,#2a0c04,#481008)', accent:'#f97316', label:'ATTACK',  rarity:'rare',     desc:'Obliterating arcane explosion.' },
}

const FALLBACK: CardArt = {
  emoji:'✨', bg:'linear-gradient(160deg,#0e0e20,#14142e)', accent:'#7c3aed',
  label:'CARD', rarity:'common', desc:'A mysterious card of unknown power.',
}

export function CardDisplay({
  card, onClick, compact,
}: {
  card: CardData; onClick?: () => void; compact?: boolean
}) {
  const art = CARD_ART[card.defId] ?? FALLBACK
  const rc  = RARITY_COLOR[art.rarity ?? 'common']

  const W    = compact ? 90  : 110
  const H    = compact ? 128 : 162
  const artH = compact ? 58  : 82
  const fz   = compact ? 28  : 38

  return (
    <div
      onClick={onClick}
      style={{
        width: W, height: H,
        borderRadius: 10, flexShrink: 0, overflow: 'hidden',
        border: `2px solid ${rc}50`,
        boxShadow: `0 0 8px ${rc}20, 0 4px 18px rgba(0,0,0,0.75)`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        userSelect: 'none', position: 'relative',
      }}
      onMouseEnter={e => {
        if (!onClick) return
        e.currentTarget.style.transform = 'translateY(-10px) scale(1.07)'
        e.currentTarget.style.borderColor = rc
        e.currentTarget.style.boxShadow =
          `0 0 22px ${rc}60, 0 14px 40px rgba(0,0,0,0.85), 0 0 60px ${art.accent}18`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.borderColor = `${rc}50`
        e.currentTarget.style.boxShadow = `0 0 8px ${rc}20, 0 4px 18px rgba(0,0,0,0.75)`
      }}
    >
      {/* ── Art zone ── */}
      <div style={{
        height: artH, background: art.bg, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: fz,
        overflow: 'hidden',
      }}>
        {/* Ambient glow behind emoji */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 70%, ${art.accent}28, transparent 65%)`,
        }} />
        {/* Bottom fade into info zone */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)',
        }} />
        {art.emoji}
        {/* Rarity gem — top right */}
        <div style={{
          position: 'absolute', top: 5, right: 5,
          width: 9, height: 9, borderRadius: '50%',
          background: rc, boxShadow: `0 0 8px ${rc}, 0 0 2px rgba(0,0,0,0.5)`,
        }} />
      </div>

      {/* ── Accent line ── */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${art.accent}dd, transparent)` }} />

      {/* ── Info zone ── */}
      <div style={{
        height: H - artH - 2,
        background: 'linear-gradient(180deg,#09091e,#07071a)',
        padding: compact ? '5px 6px 6px' : '6px 8px 8px',
        display: 'flex', flexDirection: 'column', gap: compact ? 2 : 3,
      }}>
        {/* Type label */}
        <div style={{
          fontSize: 8, fontWeight: 800, color: art.accent,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {art.label}
        </div>
        {/* Card name */}
        <div style={{
          fontSize: compact ? 10.5 : 12, fontWeight: 700,
          color: '#dde0ff', lineHeight: 1.15,
        }}>
          {card.name}
        </div>
        {/* Flavor text — only in full size */}
        {!compact && (
          <div style={{
            fontSize: 9.5, color: '#4a4a80', fontStyle: 'italic',
            lineHeight: 1.35, flexGrow: 1,
          }}>
            {art.desc}
          </div>
        )}
        {/* Stat badges */}
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 'auto' }}>
          {card.attack > 0 && <StatBadge icon="⚔" val={card.attack} color="#ef4444" />}
          {card.block  > 0 && <StatBadge icon="🛡" val={card.block}  color="#3b82f6" />}
          {card.special === 'heal1' && <StatBadge icon="💚" val={0} color="#10b981" label="HEAL" />}
        </div>
      </div>
    </div>
  )
}

function StatBadge({
  icon, val, color, label,
}: { icon: string; val: number; color: string; label?: string }) {
  return (
    <span style={{
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 4, padding: '1px 5px',
      fontSize: 9.5, color, fontWeight: 800,
      display: 'inline-flex', alignItems: 'center', gap: 2,
    }}>
      {icon}{label ?? val}
    </span>
  )
}
