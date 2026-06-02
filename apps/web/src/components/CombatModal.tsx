import { useGameStore } from '../store/gameStore'

const CARD_COLOR: Record<string, string> = {
  march:            '#2a3d2a',
  concentration:    '#2a2a4a',
  rage:             '#4a1a1a',
  determination:    '#2a1a4a',
  swiftness:        '#1a3a4a',
  promise:          '#3a2a1a',
  improvisation:    '#2a2a1a',
  threatening_aura: '#4a1a2a',
}

export function CombatModal() {
  const { combat, hand, resolveCombat, dismissCombat, playCardInCombat, levelUpMessage } = useGameStore()
  if (!combat) return null

  const { enemy, phase, playerAttack, playerBlock, result, fameGained, woundsTaken, lootCard } = combat

  const attackProgress = Math.min((playerAttack / Math.max(enemy.armor, 1)) * 100, 100)
  const blockProgress  = Math.min((playerBlock  / Math.max(enemy.attack, 1)) * 100, 100)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        background: '#16213e',
        border: '2px solid #7b5ea7',
        borderRadius: 14,
        padding: 24,
        width: 520,
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>

        {/* ── FIGHTING PHASE ── */}
        {phase === 'FIGHTING' && (
          <>
            <h2 style={{ margin: 0, color: '#ef4444', fontSize: 20 }}>⚔ Combat!</h2>

            {/* Enemy card */}
            <div style={{
              background: '#1a1a2e',
              border: '1px solid #3a1a1a',
              borderRadius: 10,
              padding: '12px 16px',
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 17, marginBottom: 8, color: '#f87171' }}>
                {enemy.name}
              </div>
              <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                <span>⚔ Attack <strong>{enemy.attack}</strong></span>
                <span>🛡 Armor <strong>{enemy.armor}</strong></span>
                <span style={{ color: '#fbbf24' }}>★ Fame <strong>{enemy.fame}</strong></span>
              </div>
            </div>

            {/* Progress bars */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                  ATTACK {playerAttack} / {enemy.armor} needed
                </div>
                <div style={{ background: '#1a1a2e', borderRadius: 4, height: 10 }}>
                  <div style={{
                    width: `${attackProgress}%`, height: '100%', borderRadius: 4,
                    background: playerAttack >= enemy.armor ? '#4ade80' : '#f87171',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                  BLOCK {playerBlock} / {enemy.attack} needed
                </div>
                <div style={{ background: '#1a1a2e', borderRadius: 4, height: 10 }}>
                  <div style={{
                    width: `${blockProgress}%`, height: '100%', borderRadius: 4,
                    background: playerBlock >= enemy.attack ? '#4ade80' : '#fbbf24',
                    transition: 'width 0.3s',
                  }} />
                </div>
              </div>
            </div>

            {/* Card hand — shown INSIDE the modal so they're clickable */}
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
                YOUR HAND — click a card to play it:
              </div>
              {hand.length === 0 ? (
                <div style={{ color: '#555', fontSize: 13, padding: '8px 0' }}>
                  No cards left — click Resolve to finish combat.
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {hand.map(card => (
                    <div
                      key={card.instanceId}
                      onClick={() => playCardInCombat(card.instanceId)}
                      style={{
                        background: CARD_COLOR[card.defId] ?? '#2a2a3a',
                        border: '2px solid #ffd700',
                        borderRadius: 8,
                        padding: '8px 10px',
                        minWidth: 80,
                        cursor: 'pointer',
                        transition: 'transform 0.1s, border-color 0.1s',
                        userSelect: 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 4 }}>
                        {card.name}
                      </div>
                      <div style={{ fontSize: 11, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {card.attack > 0 && <span style={{ color: '#f87171' }}>⚔ {card.attack}</span>}
                        {card.block  > 0 && <span style={{ color: '#60a5fa' }}>🛡 {card.block}</span>}
                        {card.move   > 0 && <span style={{ color: '#4ade80' }}>👣 {card.move}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={resolveCombat}
              style={{
                background: '#7b5ea7',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '12px 0',
                fontSize: 15,
                cursor: 'pointer',
                fontWeight: 'bold',
                marginTop: 4,
              }}
            >
              ⚔ Resolve Combat
            </button>
          </>
        )}

        {/* ── RESULT PHASE ── */}
        {phase === 'RESULT' && (
          <>
            <h2 style={{
              margin: 0, fontSize: 22,
              color: result === 'WIN' ? '#4ade80' : '#f87171',
            }}>
              {result === 'WIN' ? '✅ Victory!' : '💀 Defeated!'}
            </h2>

            <div style={{
              background: '#1a1a2e', borderRadius: 10, padding: '14px 16px',
              display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14,
            }}>
              {result === 'WIN' ? (
                <>
                  <div>You defeated <strong style={{ color: '#f87171' }}>{enemy.name}</strong>!</div>
                  <div style={{ color: '#fbbf24' }}>★ +{fameGained} Fame</div>
                  {lootCard && (
                    <div style={{
                      marginTop: 8,
                      background: CARD_COLOR[lootCard.defId] ?? '#2a2a3a',
                      border: '2px solid #ffd700',
                      borderRadius: 8,
                      padding: '10px 14px',
                    }}>
                      <div style={{ fontSize: 11, color: '#ffd700', marginBottom: 4 }}>🎁 LOOT CARD ACQUIRED</div>
                      <div style={{ fontWeight: 'bold' }}>{lootCard.name}</div>
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 4, display: 'flex', gap: 8 }}>
                        {lootCard.attack > 0 && <span style={{ color: '#f87171' }}>⚔ {lootCard.attack}</span>}
                        {lootCard.block  > 0 && <span style={{ color: '#60a5fa' }}>🛡 {lootCard.block}</span>}
                        {lootCard.move   > 0 && <span style={{ color: '#4ade80' }}>👣 {lootCard.move}</span>}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div>
                    Your attack ({playerAttack}) was not enough to breach {enemy.name}'s armor ({enemy.armor}).
                  </div>
                </>
              )}
              {woundsTaken > 0 && (
                <div style={{ color: '#f87171', marginTop: 4 }}>
                  💔 Took {woundsTaken} wound{woundsTaken > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {levelUpMessage && (
              <div style={{
                background: '#1a3a1a',
                border: '2px solid #4ade80',
                borderRadius: 10,
                padding: '12px 16px',
                color: '#4ade80',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: 15,
              }}>
                🌟 {levelUpMessage}
              </div>
            )}

            <button
              onClick={dismissCombat}
              style={{
                background: '#2a2a4a',
                color: 'white',
                border: '1px solid #7b5ea7',
                borderRadius: 8,
                padding: '12px 0',
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Continue →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
