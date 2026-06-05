import { useGameStore } from '../store/gameStore'

// ── Challenge response screen ─────────────────────────────────────────────────

export function PvpChallengeScreen() {
  const { pvpCombat, activeSeat, localSeatNames, savedState, level, fame, wounds, handSizeMax, respondToChallenge } = useGameStore()
  if (!pvpCombat || pvpCombat.phase !== 'DEFENDER_RESPONDS') return null

  const defLvl  = level
  const chalLvl = savedState?.level ?? 1
  const gap     = chalLvl - defLvl
  let penalty = gap >= 2 ? 0 : gap >= 0 ? 2 : 3 + (-gap) * 2
  const penLabel = penalty === 0 ? 'No penalty (wise retreat)' : `−${penalty} fame (cowardice!)`

  const chalSeat = pvpCombat.challengerSeat
  const defSeat  = activeSeat
  const chalName = localSeatNames[chalSeat - 1]
  const defName  = localSeatNames[defSeat  - 1]

  const row = (label: string, ours: number, theirs: number, gold?: boolean) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 6 }}>
      <div style={{ textAlign: 'right', fontSize: 13, color: ours > theirs ? '#4ade80' : '#e0e0e0', fontWeight: ours > theirs ? 700 : 400 }}>{ours}</div>
      <div style={{ fontSize: 10, color: '#3a3a6a', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', textAlign: 'center' }}>{label}</div>
      <div style={{ textAlign: 'left',  fontSize: 13, color: theirs > ours ? '#4ade80' : '#e0e0e0', fontWeight: theirs > ours ? 700 : 400 }}>{theirs}</div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210 }}>
      <div className="modal-in" style={{ background: 'linear-gradient(160deg,#1a1030,#100a20)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 16, padding: '40px 44px', textAlign: 'center', maxWidth: 400, boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize: 42, marginBottom: 8 }}>⚔</div>
        <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Duel Challenge</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#e0e0ff', marginBottom: 4 }}>{chalName} challenges you!</div>
        <div style={{ fontSize: 12, color: '#5050a0', marginBottom: 24 }}>{defName}, do you accept?</div>

        {/* Stat comparison */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, marginBottom: 10 }}>
            <div style={{ textAlign: 'right', fontSize: 11, color: '#a855f7', fontWeight: 700 }}>{chalName}</div>
            <div />
            <div style={{ textAlign: 'left',  fontSize: 11, color: '#06b6d4', fontWeight: 700 }}>{defName}</div>
          </div>
          {row('Level',  chalLvl, defLvl)}
          {row('Fame',   savedState?.fame ?? 0, fame)}
          {row('Wounds', savedState?.wounds ?? 0, wounds)}
          {row('Hand',   savedState?.handSizeMax ?? 5, handSizeMax)}
        </div>

        {/* Level gap note */}
        {gap !== 0 && (
          <div style={{ fontSize: 11, color: gap > 0 ? '#f59e0b' : '#4ade80', marginBottom: 16, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
            {gap > 0 ? `⚠ Challenger is ${gap} level(s) stronger` : `💪 You are ${-gap} level(s) stronger`}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => respondToChallenge(true)}
            style={{ flex: 2, background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: 'white', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(220,38,38,0.4)', letterSpacing: '0.04em' }}
          >
            ⚔ Accept Duel
          </button>
          <button
            onClick={() => respondToChallenge(false)}
            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 0', fontSize: 13, cursor: 'pointer' }}
          >
            <div>🏃 Decline</div>
            <div style={{ fontSize: 10, color: penalty === 0 ? '#4ade80' : '#f59e0b', marginTop: 3 }}>{penLabel}</div>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card picking modal ────────────────────────────────────────────────────────

export function PvpPickModal() {
  const { pvpCombat, activeSeat, localSeatNames, hand, playCardInPvp, lockInPvp } = useGameStore()
  if (!pvpCombat || (pvpCombat.phase !== 'CHALLENGER_PICKS' && pvpCombat.phase !== 'DEFENDER_PICKS')) return null

  const { phase, challengerSeat, challengerAtk, challengerBlk, defenderAtk, defenderBlk } = pvpCombat
  const isChal = challengerSeat === activeSeat
  const myAtk  = isChal ? challengerAtk : defenderAtk
  const myBlk  = isChal ? challengerBlk : defenderBlk
  const myName = localSeatNames[activeSeat - 1]
  const step   = phase === 'CHALLENGER_PICKS' ? 1 : 2

  const rarityColor = (r?: string) => r === 'rare' ? '#f59e0b' : r === 'uncommon' ? '#06b6d4' : '#9ca3af'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210 }}>
      <div className="modal-in" style={{ background: 'linear-gradient(160deg,#1a1030,#100a20)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: '32px 36px', maxWidth: 480, width: '90%', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
            Duel — Step {step} of 2
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#e0e0ff' }}>{myName} — Pick your cards</div>
          <div style={{ fontSize: 12, color: '#5050a0', marginTop: 4 }}>Select cards to commit. Your opponent won't see these.</div>
        </div>

        {/* Current totals */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>⚔ ATTACK</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fca5a5' }}>{myAtk}</div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#60a5fa', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 2 }}>🛡 BLOCK</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#93c5fd' }}>{myBlk}</div>
          </div>
        </div>

        {/* Hand */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20, maxHeight: 220, overflowY: 'auto' }}>
          {hand.length === 0 && <div style={{ color: '#3a3a6a', fontSize: 13, padding: 20 }}>No cards left in hand</div>}
          {hand.map(card => (
            <button
              key={card.instanceId}
              onClick={() => playCardInPvp(card.instanceId)}
              style={{
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${rarityColor(card.rarity)}44`,
                borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                transition: 'background 0.15s, border-color 0.15s', minWidth: 80,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = rarityColor(card.rarity) + '88' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = rarityColor(card.rarity) + '44' }}
            >
              <div style={{ fontSize: 11, color: rarityColor(card.rarity), fontWeight: 700 }}>{card.name}</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                {card.attack > 0 && <span style={{ color: '#fca5a5' }}>⚔{card.attack}</span>}
                {card.block > 0  && <span style={{ color: '#93c5fd' }}>🛡{card.block}</span>}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={lockInPvp}
          style={{ width: '100%', background: 'linear-gradient(135deg,#dc2626,#991b1b)', color: 'white', border: 'none', borderRadius: 10, padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 20px rgba(220,38,38,0.35)', letterSpacing: '0.04em' }}
        >
          Lock In ({myAtk} ATK / {myBlk} BLK) →
        </button>
        <div style={{ fontSize: 11, color: '#2a2a4a', textAlign: 'center', marginTop: 8 }}>Can also lock in with 0 — sometimes blocking is enough.</div>
      </div>
    </div>
  )
}

// ── Resolution screen ─────────────────────────────────────────────────────────

export function PvpResultModal() {
  const { pvpCombat, localSeatNames, dismissPvp } = useGameStore()
  if (!pvpCombat || pvpCombat.phase !== 'RESOLUTION') return null

  const { challengerSeat, challengerAtk, challengerBlk, defenderAtk, defenderBlk, result, woundsToChallenger, woundsToDefender, fameToChallenger, fameToDefender } = pvpCombat
  const chalName = localSeatNames[challengerSeat - 1]
  const defName  = localSeatNames[challengerSeat === 1 ? 1 : 0]

  const winner = result === 'CHALLENGER_WIN' ? chalName : result === 'DEFENDER_WIN' ? defName : null
  const winColor = '#f59e0b'

  const side = (name: string, atk: number, blk: number, wounds: number, famePt: number, isChal: boolean) => (
    <div style={{ flex: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '16px 14px', textAlign: 'center', border: `1px solid ${winner === name ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: isChal ? '#a855f7' : '#06b6d4', letterSpacing: '0.08em', marginBottom: 6 }}>
        {name} {winner === name && '🏆'}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: '#fca5a5' }}>⚔ {atk}</div>
        <div style={{ fontSize: 11, color: '#93c5fd' }}>🛡 {blk}</div>
      </div>
      <div style={{ fontSize: 11, color: '#5050a0' }}>Wounds taken</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: wounds > 0 ? '#ef4444' : '#4ade80', marginBottom: 8 }}>{wounds}</div>
      {famePt > 0 && <div style={{ fontSize: 12, fontWeight: 700, color: winColor }}>+{famePt} fame</div>}
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 210 }}>
      <div className="modal-in" style={{ background: 'linear-gradient(160deg,#1a1030,#100a20)', border: `1px solid ${winner ? 'rgba(245,158,11,0.4)' : 'rgba(100,100,255,0.3)'}`, borderRadius: 16, padding: '36px 40px', maxWidth: 440, textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>{winner ? '🏆' : '🤝'}</div>
        <div style={{ fontSize: 11, color: winner ? winColor : '#6060a0', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
          {winner ? 'Victory' : 'Draw'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#e0e0ff', marginBottom: 24 }}>
          {winner ? `${winner} wins the duel!` : 'A perfect draw!'}
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          {side(chalName, challengerAtk, challengerBlk, woundsToChallenger, fameToChallenger, true)}
          <div style={{ display: 'flex', alignItems: 'center', color: '#2a2a4a', fontSize: 18 }}>⚔</div>
          {side(defName, defenderAtk, defenderBlk, woundsToDefender, fameToDefender, false)}
        </div>

        <div style={{ fontSize: 11, color: '#3a3a5a', marginBottom: 20, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
          5-turn duel cooldown applies. Keep exploring to grow stronger!
        </div>

        <button
          onClick={dismissPvp}
          style={{ width: '100%', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Continue Quest →
        </button>
      </div>
    </div>
  )
}
