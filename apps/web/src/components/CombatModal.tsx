import { useGameStore } from '../store/gameStore'
import { CardDisplay } from './CardDisplay'
import { ItemBag, ItemDropDisplay } from './ItemBag'

const ENEMY_PORTRAIT: Record<string, string> = {
  'Goblin Scout':   '👺', 'Wolf':           '🐺', 'Orc Grunt':      '👹',
  'Orc Warrior':    '👹', 'Wolf Rider':     '🐺', 'Orc Shaman':     '🧙',
  'Plague Rat':     '🐀', 'Guardian Golem': '🗿', 'Ice Witch':      '🧊',
  'Troll Warrior':  '👾', 'Siege Golem':    '🤖', 'Dragon Whelp':   '🐉',
  'Dark Mage':      '🧙', 'Necromancer':    '💀', 'Wyvern':         '🦎',
  'Ancient Dragon': '🐲', 'Shadow Lord':    '😈', 'Lich King':      '☠️',
  'Void Titan':     '👁️',
}

function Bar({ value, max, color, label, pulse }: {
  value: number; max: number; color: string; label: string; pulse?: boolean
}) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100)
  const met = value >= max
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6060a0', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ color: met ? '#4ade80' : color, fontWeight: 700 }}>{value} / {max} {met ? '✓' : ''}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: met ? 'linear-gradient(90deg,#059669,#4ade80)' : `linear-gradient(90deg,${color}aa,${color})`,
          transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: met ? '0 0 10px #4ade8088' : `0 0 8px ${color}66`,
          animation: pulse ? 'enemy-pulse 1s ease-in-out 2' : undefined,
        }} />
      </div>
    </div>
  )
}

function HpBar({ hp, maxHp }: { hp: number; maxHp: number }) {
  const pct = Math.min((hp / Math.max(maxHp, 1)) * 100, 100)
  const low = hp <= Math.ceil(maxHp / 3)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#6060a0', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Enemy HP</span>
        <span style={{ color: low ? '#f87171' : '#a3e635', fontWeight: 700 }}>{hp} / {maxHp}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 99, height: 12, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 99,
          background: low
            ? 'linear-gradient(90deg,#991b1b,#ef4444)'
            : 'linear-gradient(90deg,#15803d,#4ade80)',
          transition: 'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: low ? '0 0 10px rgba(239,68,68,0.5)' : '0 0 10px rgba(74,222,128,0.4)',
        }} />
      </div>
    </div>
  )
}

export function CombatModal() {
  const { combat, hand, items, resolveCombat, dismissCombat, playCardInCombat, levelUpMessage } = useGameStore()
  if (!combat) return null

  const { enemy, phase, round, playerAttack, playerBlock, result, fameGained, woundsTaken, lootCard, itemDrop, roundLog } = combat
  const portrait = ENEMY_PORTRAIT[enemy.name] ?? '👿'
  const hasItems = items.length > 0
  const armorReduction = Math.floor(enemy.armor / 2)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.87)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }}>
      <div className="modal-in" style={{
        background: 'linear-gradient(160deg,#120c24 0%,#080818 100%)',
        border: '1px solid rgba(168,85,247,0.25)', borderRadius: 16,
        width: 620, maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 0 60px rgba(168,85,247,0.1)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Enemy header */}
        <div style={{
          background: 'rgba(239,68,68,0.07)', borderBottom: '1px solid rgba(239,68,68,0.14)',
          padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 18,
        }}>
          <div style={{
            width: 68, height: 68, borderRadius: 14, flexShrink: 0,
            background: 'radial-gradient(circle at 38% 33%, #3a0808, #1a0404)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 38, boxShadow: '0 0 24px rgba(239,68,68,0.2)',
          }}>{portrait}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                ⚔ Combat — Round {round}
              </div>
              {round > 1 && (
                <span style={{ fontSize: 9, padding: '1px 7px', borderRadius: 99, background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                  ONGOING
                </span>
              )}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ffe4e4', marginBottom: 6 }}>{enemy.name}</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
              <span style={{ color: '#f87171' }}>⚔ {enemy.attack} ATK/round</span>
              <span style={{ color: '#94a3b8' }}>🛡 {enemy.armor} armor (−{armorReduction} dmg reduction)</span>
              <span style={{ color: '#fbbf24' }}>★ {enemy.fame} fame</span>
            </div>
          </div>
        </div>

        {/* HP bar always visible */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <HpBar hp={enemy.hp} maxHp={enemy.maxHp} />
        </div>

        {/* Last round log */}
        {roundLog && phase === 'PLAYER_TURN' && (
          <div style={{
            margin: '10px 22px 0', padding: '8px 14px', borderRadius: 8,
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)',
            fontSize: 12, color: '#d97706',
          }}>
            📋 {roundLog}
          </div>
        )}

        {/* PLAYER_TURN phase */}
        {phase === 'PLAYER_TURN' && (
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Damage preview */}
            <div style={{ display: 'flex', gap: 12 }}>
              <Bar value={playerAttack} max={enemy.armor} color="#ef4444" label={`Your Attack (need >${armorReduction} to hit)`} />
              <Bar value={playerBlock}  max={enemy.attack} color="#3b82f6" label="Your Block" />
            </div>

            {/* Damage preview chips */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#f87171', letterSpacing: '0.08em', marginBottom: 2 }}>DMG TO ENEMY</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: playerAttack > armorReduction ? '#fca5a5' : '#4a2030' }}>
                  {Math.max(0, playerAttack - armorReduction)}
                </div>
              </div>
              <div style={{ flex: 1, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#60a5fa', letterSpacing: '0.08em', marginBottom: 2 }}>DMG TO YOU</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: playerBlock >= enemy.attack ? '#4ade80' : '#fca5a5' }}>
                  {Math.max(0, enemy.attack - playerBlock)}
                </div>
              </div>
            </div>

            {/* Cards */}
            <div>
              <div style={{ fontSize: 11, color: '#5050a0', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>
                {hand.length > 0 ? 'Cards — click to play' : 'No cards — try blocking or striking now!'}
              </div>
              {hand.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {hand.map(card => (
                    <CardDisplay key={card.instanceId} card={card} compact onClick={() => playCardInCombat(card.instanceId)} />
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            {hasItems && (
              <>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <ItemBag context="combat" />
              </>
            )}

            <button
              onClick={resolveCombat}
              style={{
                background: 'linear-gradient(135deg,#dc2626,#991b1b)',
                color: 'white', border: 'none', borderRadius: 10,
                padding: '14px 0', fontSize: 15, fontWeight: 800,
                cursor: 'pointer', letterSpacing: '0.04em',
                boxShadow: '0 4px 24px rgba(220,38,38,0.45)',
                transition: 'opacity 0.15s, transform 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1';    e.currentTarget.style.transform = 'none' }}
            >
              ⚔ Strike! (Round {round})
            </button>
            <div style={{ fontSize: 11, color: '#2a2a4a', textAlign: 'center', marginTop: -10 }}>
              If you deal 0 damage you still push the enemy back — block their attack to survive another round!
            </div>
          </div>
        )}

        {/* RESULT phase */}
        {phase === 'RESULT' && (
          <div style={{ padding: '24px 22px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>{result === 'WIN' ? '🏆' : '💔'}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, color: result === 'WIN' ? '#4ade80' : '#ef4444' }}>
                {result === 'WIN' ? 'Victory!' : 'Defeated!'}
              </div>
              <div style={{ fontSize: 13, color: '#6060a0' }}>
                {result === 'WIN' ? `You bested ${enemy.name} in ${round} round(s)` : `${enemy.name} was too strong`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {result === 'WIN' && (
                <div style={{ background: 'rgba(245,158,11,0.09)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '12px 22px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#8060a0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fame Gained</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#fbbf24' }}>+{fameGained}</div>
                </div>
              )}
              {woundsTaken > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '12px 22px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: '#8060a0', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Wounds Taken</div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#f87171' }}>+{woundsTaken}</div>
                </div>
              )}
            </div>

            {lootCard && (
              <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)', borderRadius: 14, padding: '16px' }}>
                <div style={{ fontSize: 11, color: '#a855f7', fontWeight: 700, marginBottom: 14, letterSpacing: '0.06em', textAlign: 'center' }}>🃏 CARD LOOT</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <CardDisplay card={lootCard} />
                </div>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#3a3a70', marginTop: 10 }}>Added permanently to your deck</div>
              </div>
            )}

            {itemDrop && (
              <div>
                <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em' }}>🎁 ITEM DROP</div>
                <ItemDropDisplay item={itemDrop} />
              </div>
            )}

            {levelUpMessage && (
              <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(52,211,153,0.06))', border: '1px solid rgba(52,211,153,0.28)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 30 }}>🌟</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#4ade80', fontSize: 16 }}>Level Up!</div>
                  <div style={{ fontSize: 12, color: '#5090a0', marginTop: 2 }}>{levelUpMessage}</div>
                </div>
              </div>
            )}

            <button
              onClick={dismissCombat}
              style={{ background: 'rgba(255,255,255,0.04)', color: '#a0a0c0', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 10, padding: '13px 0', fontSize: 14, cursor: 'pointer', fontWeight: 600, transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >Continue →</button>
          </div>
        )}
      </div>
    </div>
  )
}
