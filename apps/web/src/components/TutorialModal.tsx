import { useState, useEffect } from 'react'

interface Props { onClose: () => void }

type Tab = 'quick' | 'movement' | 'combat' | 'cards' | 'progression' | 'multiplayer' | 'items'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'quick',       label: 'Quick Start',  icon: '⚡' },
  { id: 'movement',    label: 'Movement',     icon: '👣' },
  { id: 'combat',      label: 'Combat',       icon: '⚔' },
  { id: 'cards',       label: 'Cards',        icon: '🃏' },
  { id: 'progression', label: 'Levelling',    icon: '🌟' },
  { id: 'items',       label: 'Items',        icon: '🎒' },
  { id: 'multiplayer', label: 'Co-op',        icon: '👥' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
        color: '#a855f7', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Tip({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontSize: 13, color: '#c0c0d8', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

function StatBadge({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}44`,
      borderRadius: 6, padding: '4px 10px', marginRight: 8, marginBottom: 6,
    }}>
      <span style={{ color, fontWeight: 700, fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#aaa' }}>{children}</span>
    </div>
  )
}

const CONTENT: Record<Tab, React.ReactNode> = {
  items: (
    <>
      <Section title="Consumable items">
        <Tip icon="🎒" text="Items are consumables that give one-time boosts. You can hold any number at once." />
        <Tip icon="🗺" text="Explore new non-enemy tiles — 12% chance to find an item hidden in the terrain." />
        <Tip icon="⚔" text="Defeat enemies — 25–50% chance they drop an item (higher rings = rarer loot)." />
      </Section>

      <Section title="Using items">
        <Tip icon="🃏" text="In combat: open your item bag below the card hand. Combat items (⚔) are active; map items are greyed out." />
        <Tip icon="🗺" text="On the map: items appear to the right of your card hand. Map items (🌿) are active; combat items are greyed out." />
        <Tip icon="👆" text="Click an item icon to consume it instantly. Items are gone after use — no undo." />
      </Section>

      <Section title="Item types by rarity">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { rarity: 'Common',   color: '#6b7280', icon: '🧪', ex: 'Health Potion, Swift Boots, War Elixir, Iron Tonic',  note: 'Reliably useful — small boosts' },
            { rarity: 'Uncommon', color: '#3b82f6', icon: '💠', ex: 'Mana Crystal, Rage Stone, Smoke Bomb',               note: 'Situational power spikes' },
            { rarity: 'Rare',     color: '#f59e0b', icon: '✨', ex: 'Dragon Blood, Arcane Mirror, Elixir of Power',        note: 'Game-changing in tough fights' },
          ].map(r => (
            <div key={r.rarity} style={{
              background: `linear-gradient(135deg,${r.color}18,transparent)`,
              border: `1px solid ${r.color}33`, borderRadius: 8, padding: '10px 14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{ fontSize: 14 }}>{r.icon}</span>
                <strong style={{ color: r.color, fontSize: 12 }}>{r.rarity}</strong>
                <span style={{ fontSize: 11, color: '#666' }}>{r.note}</span>
              </div>
              <div style={{ fontSize: 11, color: '#6060a0' }}>e.g. {r.ex}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  ),

  multiplayer: (
    <>
      <div style={{
        background: 'linear-gradient(135deg,rgba(6,182,212,0.08),rgba(14,116,144,0.04))',
        border: '1px solid rgba(6,182,212,0.25)',
        borderRadius: 10, padding: '14px 18px', marginBottom: 20,
        fontSize: 13, color: '#c0e8f0', lineHeight: 1.7,
      }}>
        <strong style={{ color: '#06b6d4' }}>Co-op Quest</strong> lets two Mage Knights
        share a map and take turns exploring. Work together to push deeper into enemy territory
        than you could alone.
      </div>

      <Section title="Starting a co-op game">
        <Tip icon="1️⃣" text='In the Lobby, click "Co-op Quest (2 players)" to create a session. You are taken to the game page immediately.' />
        <Tip icon="2️⃣" text='The game shows a "Waiting for companion" screen. Share the page URL with your partner.' />
        <Tip icon="3️⃣" text='Your partner opens the Lobby, sees your session listed as "Co-op 1/2", and clicks Join →.' />
        <Tip icon="4️⃣" text="The game starts automatically when both players are connected. The host (creator) goes first." />
      </Section>

      <Section title="Turn-based rules">
        <Tip icon="⚡" text='Only the active player can move, play cards, fight, or use items. The HUD shows "YOUR TURN" or "THEIR TURN".' />
        <Tip icon="🔄" text='Click End Turn when you are done. Move points reset and the turn passes to your companion.' />
        <Tip icon="📍" text="Your companion's position appears on the map as a teal knight (♘). Watch where they explore." />
        <Tip icon="🗺" text="The map is shared — when either player reveals tiles, both players see them immediately." />
      </Section>

      <Section title="Separate inventories">
        <Tip icon="🃏" text="Each player has their own deck, hand, discard pile, and loot cards. You build independently." />
        <Tip icon="🎒" text="Items are personal — you cannot trade or share items with your companion." />
        <Tip icon="⚔" text="You each fight your own enemies. You cannot help each other in combat." />
        <Tip icon="⭐" text="Fame and levelling are tracked separately. Racing to Level 7 first is a friendly competition." />
      </Section>

      <Section title="Cooperation & strategy">
        <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#c0e8f0', lineHeight: 2 }}>
            <div>📡 Coordinate verbally — decide who covers which part of the map.</div>
            <div>🛡 One player draws enemies, the other explores safely behind them.</div>
            <div>⚔ Take turns fighting tough ring-4 and ring-5 enemies to share the risk.</div>
            <div>💔 If either player is knocked out, call it a team loss — protect each other!</div>
          </div>
        </div>
      </Section>
    </>
  ),
  quick: (
    <>
      <div style={{
        background: 'linear-gradient(135deg, #1c0a3c, #0a0a20)',
        border: '1px solid rgba(168,85,247,0.3)',
        borderRadius: 10, padding: '16px 20px', marginBottom: 20,
        fontSize: 13, color: '#c0c0d8', lineHeight: 1.8,
      }}>
        You are a <strong style={{ color: '#f0f0ff' }}>Mage Knight</strong> — explore the land,
        defeat enemies, collect loot, and grow powerful enough to conquer the realm.
      </div>

      <Section title="In 60 seconds">
        <Tip icon="🗺" text="The map starts hidden. Move to adjacent gold tiles to reveal terrain." />
        <Tip icon="⚔" text="Tiles with a ⚔ icon contain enemies. Walk in to start combat." />
        <Tip icon="🃏" text="In combat, click your hand cards to add their Attack and Block values." />
        <Tip icon="🎯" text="Your Attack must reach the enemy's Armor to defeat it." />
        <Tip icon="🛡" text="Your Block reduces incoming damage. Unblocked hits become wounds." />
        <Tip icon="🎁" text="Defeat enemies to gain Fame and a random loot card." />
        <Tip icon="🔄" text="Click End Turn to shuffle all cards and draw a fresh hand." />
        <Tip icon="☠" text="Too many wounds fills your hand — Game Over." />
      </Section>

      <Section title="Terrain types">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { color: '#4a7c3f', label: 'Plains', note: 'Open land' },
            { color: '#1a5224', label: 'Forest', note: 'Dense trees' },
            { color: '#7a5533', label: 'Hills',  note: 'Rolling hills' },
            { color: '#5a6070', label: 'Mtns',   note: 'High peaks' },
            { color: '#c8831a', label: 'Desert', note: 'Dry sands' },
            { color: '#3a5a28', label: 'Swamp',  note: 'Murky bog' },
            { color: '#1a3a7a', label: 'Lake',   note: 'Impassable' },
          ].map(t => (
            <div key={t.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.04)', borderRadius: 6, padding: '4px 10px',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e0f0' }}>{t.label}</span>
              <span style={{ fontSize: 11, color: '#666' }}>{t.note}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  ),

  movement: (
    <>
      <Section title="How movement works">
        <Tip icon="🟡" text="Gold-highlighted hexes are tiles you can move to this turn — they must be adjacent to your current position." />
        <Tip icon="♞" text="Click a highlighted tile to move your knight there instantly." />
        <Tip icon="🌫" text="Unexplored tiles show '?' and dark colour. Moving next to them reveals their terrain and any enemies inside." />
        <Tip icon="🚫" text="Lake tiles (blue) cannot be entered at all — move around them." />
      </Section>

      <Section title="Terrain & strategy">
        <Tip icon="🌿" text="Plains are the easiest terrain — lots of connecting paths." />
        <Tip icon="🌲" text="Forests and Hills are common and may hide enemies worth moderate fame." />
        <Tip icon="⛰" text="Mountains contain tough enemies but the highest fame rewards." />
        <Tip icon="🏜" text="Desert tiles hide rare loot enemies — high risk, high reward." />
        <Tip icon="🌊" text="Swamps often shelter powerful foes. Enter only when you're strong." />
      </Section>

      <Section title="Turn flow">
        <Tip icon="1️⃣" text="Move to one or more adjacent tiles (enemies stop you)." />
        <Tip icon="2️⃣" text="Resolve any combat that triggers when you enter enemy tiles." />
        <Tip icon="3️⃣" text="Use items from your bag (🎒) to boost moves or heal before ending your turn." />
        <Tip icon="4️⃣" text="Click End Turn → your full hand is shuffled and redrawn." />
      </Section>
    </>
  ),

  combat: (
    <>
      <Section title="Combat overview">
        <Tip icon="⚔" text="Stepping onto a tile with an enemy icon starts combat immediately." />
        <Tip icon="🃏" text="The combat window shows your hand — click cards to play them." />
        <Tip icon="📊" text="Two progress bars track your current Attack and Block totals vs the enemy's stats." />
        <Tip icon="✅" text="When ready, click Resolve Combat. Results are calculated and applied." />
      </Section>

      <Section title="Attack vs Armor">
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: '#f87171', marginBottom: 6 }}>Victory condition</div>
          <div style={{ fontSize: 13, color: '#c0c0d8' }}>Your total ⚔ Attack ≥ enemy Armor → enemy is defeated. You gain Fame and a loot card.</div>
        </div>
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 14 }}>
          <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 6 }}>Damage condition</div>
          <div style={{ fontSize: 13, color: '#c0c0d8' }}>enemy Attack − your 🛡 Block = wounds taken. Each unblocked point of damage = 1 wound.</div>
        </div>
      </Section>

      <Section title="Example fight">
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 14, fontSize: 13, color: '#c0c0d8', lineHeight: 2 }}>
          <div>Enemy: <strong>Orc Grunt</strong> (ATK 2, Armor 2)</div>
          <div>You play <strong>Rage</strong> (+2 ATK) and <strong>Determination</strong> (+2 BLK).</div>
          <div>Result: ATK 2 ≥ Armor 2 ✅ → <span style={{ color: '#4ade80' }}>Orc defeated!</span></div>
          <div>Damage: ATK 2 − BLK 2 = 0 → <span style={{ color: '#4ade80' }}>No wounds taken.</span></div>
        </div>
      </Section>
    </>
  ),

  cards: (
    <>
      <Section title="Card types">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { color: '#ef4444', icon: '⚔', name: 'Attack cards', ex: 'Rage, Threatening Aura', desc: 'Add to your Attack total in combat. Needed to pierce enemy armor.' },
            { color: '#3b82f6', icon: '🛡', name: 'Block cards',  ex: 'Determination, Promise',  desc: 'Add to your Block total. Reduces wounds you take from enemy attacks.' },
            { color: '#10b981', icon: '💚', name: 'Heal cards',   ex: 'Tranquility',              desc: 'Remove wounds when played in combat — rare and precious.' },
            { color: '#a855f7', icon: '✦',  name: 'Balanced cards', ex: 'Concentration, Improvisation', desc: 'Provide a bit of everything — flexible in any situation.' },
          ].map(c => (
            <div key={c.name} style={{
              background: `linear-gradient(135deg, ${c.color}18, transparent)`,
              border: `1px solid ${c.color}33`, borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ color: c.color, fontSize: 16 }}>{c.icon}</span>
                <strong style={{ color: '#f0f0ff', fontSize: 13 }}>{c.name}</strong>
                <span style={{ fontSize: 11, color: '#666' }}>e.g. {c.ex}</span>
              </div>
              <div style={{ fontSize: 12, color: '#9090b0' }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Deck cycling">
        <Tip icon="🔄" text="Clicking End Turn shuffles ALL your cards (hand + discard) into a new deck and deals you a fresh hand." />
        <Tip icon="🎁" text="Loot cards won from enemies are permanently added to your deck — they appear in future hands." />
        <Tip icon="📈" text="As you level up, your hand size increases, so you draw more cards per turn." />
      </Section>
    </>
  ),

  progression: (
    <>
      <Section title="Fame & levels">
        <Tip icon="★" text="Defeating enemies grants Fame. The harder the enemy, the more fame you earn." />
        <Tip icon="📊" text="Watch the fame bar in the top HUD — when it fills, you gain a level." />
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: 14, marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#fbbf24', marginBottom: 8, fontWeight: 700 }}>FAME THRESHOLDS</div>
          {[['Level 1', 0], ['Level 2', 3], ['Level 3', 8], ['Level 4', 14], ['Level 5', 21], ['Level 6', 30], ['Level 7 (Max)', 40]].map(([lv, th]) => (
            <div key={lv as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#c0c0a0', padding: '3px 0' }}>
              <span>{lv as string}</span><span style={{ color: '#fbbf24' }}>{th as number} fame</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Level-up bonuses">
        <Tip icon="🌟" text="Even levels (2, 4, 6) increase your maximum hand size by 1 — you draw and play more cards per turn." />
        <Tip icon="⚔" text="Odd levels (3, 5, 7) improve your combat efficiency — plan around these milestones." />
        <Tip icon="🎁" text="Every enemy you defeat adds a loot card to your deck — keep fighting to build a powerful collection." />
      </Section>

      <Section title="Winning & losing">
        <Tip icon="🏆" text="Reach Level 7 (40 fame) to become a legendary Mage Knight — that's the current win condition." />
        <Tip icon="💔" text="Wounds fill your hand slots. When wounds ≥ hand size, you are Knocked Out — Game Over." />
        <Tip icon="💡" text="Tip: always keep at least one block card available so you don't take avoidable wounds." />
      </Section>
    </>
  ),
}

export function TutorialModal({ onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('quick')

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 300,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="modal-in"
        style={{
          background: 'linear-gradient(160deg, #12122a 0%, #0a0a1a 100%)',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 14,
          width: 580,
          maxWidth: '96vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(168,85,247,0.15)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(124,58,237,0.08)',
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#f0f0ff' }}>📖 How to Play</div>
            <div style={{ fontSize: 12, color: '#7070a0', marginTop: 2 }}>Press Esc or click outside to close</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#8888aa',
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Tab bar */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? 'rgba(124,58,237,0.2)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid #a855f7' : '2px solid transparent',
                color: activeTab === t.id ? '#e0e0ff' : '#6060a0',
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: activeTab === t.id ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s, background 0.15s',
                display: 'flex', gap: 6, alignItems: 'center',
              }}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {CONTENT[activeTab]}
        </div>
      </div>
    </div>
  )
}
