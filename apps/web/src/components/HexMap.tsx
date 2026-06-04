import { useCallback } from 'react'
import { useGameStore, HexCoord, TileData, TERRAIN_MOVE_COST } from '../store/gameStore'

const HEX_SIZE = 28
const SQRT3 = Math.sqrt(3)

const TERRAIN: Record<string, { fill: string; border: string; emoji: string }> = {
  PLAINS:    { fill: '#1e3d12', border: '#2e5c1a', emoji: '🌿' },
  FOREST:    { fill: '#0a2810', border: '#145018', emoji: '🌲' },
  HILLS:     { fill: '#3d2410', border: '#5c3618', emoji: '⛰' },
  MOUNTAINS: { fill: '#1e2430', border: '#323c50', emoji: '🗻' },
  LAKE:      { fill: '#0a1e50', border: '#1430a0', emoji: '🌊' },
  DESERT:    { fill: '#503810', border: '#906020', emoji: '🏜' },
  SWAMP:     { fill: '#162410', border: '#283c18', emoji: '🌾' },
}

function hexToPixel(q: number, r: number) {
  return {
    x: HEX_SIZE * (SQRT3 * q + SQRT3 / 2 * r),
    y: HEX_SIZE * (3 / 2 * r),
  }
}

function hexPoints(cx: number, cy: number, size: number) {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const HEX_DIRS: HexCoord[] = [
  { q:1,r:0 },{ q:-1,r:0 },{ q:0,r:1 },{ q:0,r:-1 },{ q:1,r:-1 },{ q:-1,r:1 },
]
function isNeighbor(a: HexCoord, b: HexCoord) {
  return HEX_DIRS.some(d => a.q + d.q === b.q && a.r + d.r === b.r)
}

const STARS = Array.from({ length: 80 }, (_, i) => ({
  x: ((i * 313.7 + 17) % 1400) - 100,
  y: ((i * 197.3 + 53) % 1000) - 100,
  r: i % 5 === 0 ? 1 : 0.5,
  o: 0.1 + (i % 4) * 0.06,
}))

function HexTile({ tile, isPlayer, isOpponent, canMove, moveCost, onClick }: {
  tile: TileData; isPlayer: boolean; isOpponent: boolean; canMove: boolean; moveCost?: number; onClick: () => void
}) {
  const { x, y } = hexToPixel(tile.coord.q, tile.coord.r)
  const t = TERRAIN[tile.terrain]
  const inner = HEX_SIZE - 1.5
  const outer = HEX_SIZE + 1

  return (
    <g onClick={onClick} style={{ cursor: canMove ? 'pointer' : 'default' }}>
      {/* Drop shadow */}
      <polygon points={hexPoints(x, y + 2, inner)} fill="rgba(0,0,0,0.4)" />

      {/* Tile body */}
      <polygon
        points={hexPoints(x, y, inner)}
        fill={tile.revealed ? t.fill : '#080818'}
        stroke={canMove ? '#f59e0b' : isPlayer ? '#c084fc' : tile.revealed ? t.border : '#181828'}
        strokeWidth={canMove ? 2.5 : isPlayer ? 2.5 : 1}
      />

      {/* Move highlight ring */}
      {canMove && (
        <polygon
          points={hexPoints(x, y, outer)}
          fill="none" stroke="#f59e0b" strokeWidth={2}
          strokeDasharray="5 3" opacity={0.5}
          style={{ animation: 'spin-dash 6s linear infinite' }}
        />
      )}

      {/* Fog */}
      {!tile.revealed && (
        <>
          <polygon points={hexPoints(x, y, inner)} fill="rgba(5,5,20,0.72)" />
          <text x={x} y={y + 6} textAnchor="middle" fontSize={18} fill="#1c1c38"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>?</text>
        </>
      )}

      {/* Terrain emoji */}
      {tile.revealed && (
        <text x={x} y={y + 5} textAnchor="middle" fontSize={13}
          style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {t.emoji}
        </text>
      )}

      {/* Move cost badge on affordable neighbours */}
      {canMove && moveCost !== undefined && (
        <text
          x={x} y={y + HEX_SIZE - 4}
          textAnchor="middle" fontSize={9} fontWeight="bold"
          fill="#f59e0b" opacity={0.9}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          -{moveCost}
        </text>
      )}

      {/* Enemy badge */}
      {tile.revealed && tile.hasEnemy && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={x + 14} cy={y - 14} r={10} fill="#7f1d1d" stroke="#ef4444" strokeWidth={1.5}
            style={{ animation: 'enemy-pulse 2s ease-in-out infinite' }} />
          <text x={x + 14} y={y - 10} textAnchor="middle" fontSize={10} fill="white">⚔</text>
        </g>
      )}

      {/* Player avatar */}
      {isPlayer && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={x} cy={y - 10} r={14} fill="rgba(139,92,246,0.2)"
            style={{ animation: 'player-glow 2s ease-in-out infinite' }} />
          <circle cx={x} cy={y - 10} r={10} fill="url(#playerGrad)" stroke="#c084fc" strokeWidth={1.5} />
          <text x={x} y={y - 5} textAnchor="middle" fontSize={11} fill="white">♞</text>
        </g>
      )}

      {/* Opponent avatar (co-op) */}
      {isOpponent && !isPlayer && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={x + 12} cy={y - 8} r={12} fill="rgba(6,182,212,0.2)"
            style={{ animation: 'player-glow 2.4s ease-in-out infinite' }} />
          <circle cx={x + 12} cy={y - 8} r={9} fill="url(#oppGrad)" stroke="#06b6d4" strokeWidth={1.5} />
          <text x={x + 12} y={y - 3} textAnchor="middle" fontSize={10} fill="white">♘</text>
        </g>
      )}
    </g>
  )
}

export function HexMap() {
  const { tiles, playerPos, combat, movePlayer, movePoints, movePointsMax, opponent, mode } = useGameStore()

  const VIEW_W = 700, VIEW_H = 520
  const { x: px, y: py } = hexToPixel(playerPos.q, playerPos.r)
  const dx = VIEW_W / 2 - px
  const dy = VIEW_H / 2 - py

  const handleClick = useCallback((tile: TileData) => {
    if (combat) return
    movePlayer(tile.coord)
  }, [combat, movePlayer])

  const outOfMoves = movePoints === 0

  return (
    <div style={{
      flex: 1, overflow: 'hidden', minHeight: 0,
      background: 'radial-gradient(ellipse at 50% 40%, #0e0e28 0%, #06060f 100%)',
      borderRadius: 10,
      border: '1px solid rgba(124,58,237,0.15)',
      position: 'relative',
    }}>
      {/* ── Move Points HUD ── */}
      <div style={{
        position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(4,4,18,0.88)',
        backdropFilter: 'blur(12px)',
        border: `1px solid ${outOfMoves ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.28)'}`,
        borderRadius: 99,
        padding: '7px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 10,
        boxShadow: `0 4px 20px rgba(0,0,0,0.55)${outOfMoves ? ', 0 0 20px rgba(239,68,68,0.15)' : ''}`,
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}>
        <span style={{ fontSize: 15 }}>🥾</span>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: movePointsMax }, (_, i) => (
            <div key={i} style={{
              width: 11, height: 11, borderRadius: 3,
              background: i < movePoints ? '#f59e0b' : '#14142a',
              border: `1px solid ${i < movePoints ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.06)'}`,
              boxShadow: i < movePoints ? '0 0 6px rgba(245,158,11,0.45)' : 'none',
              transition: 'all 0.2s',
            }} />
          ))}
        </div>

        <span style={{
          fontSize: 12, fontWeight: 800, letterSpacing: '0.04em',
          color: outOfMoves ? '#ef4444' : '#f59e0b',
          minWidth: 80,
        }}>
          {outOfMoves ? 'OUT OF MOVES' : `${movePoints} / ${movePointsMax} moves`}
        </span>
      </div>

      {/* ── Terrain cost legend ── */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        display: 'flex', flexDirection: 'column', gap: 3, zIndex: 10,
      }}>
        {[
          { emoji: '🌿', label: 'Plains', cost: 1 },
          { emoji: '🌲', label: 'Forest', cost: 2 },
          { emoji: '⛰',  label: 'Hills',  cost: 2 },
          { emoji: '🗻', label: 'Mountains', cost: 3 },
        ].map(row => (
          <div key={row.label} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,0,0,0.6)', borderRadius: 5, padding: '2px 7px',
          }}>
            <span style={{ fontSize: 10 }}>{row.emoji}</span>
            <span style={{ fontSize: 9, color: '#5a5a80' }}>{row.label}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', marginLeft: 'auto' }}>-{row.cost}</span>
          </div>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%" height="100%"
        style={{ display: 'block' }}
      >
        <defs>
          <radialGradient id="playerGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="100%" stopColor="#7c3aed" />
          </radialGradient>
          <radialGradient id="oppGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#cffafe" />
            <stop offset="100%" stopColor="#0e7490" />
          </radialGradient>
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Static star field */}
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
        ))}

        {/* Map tiles — player-centered camera */}
        <g style={{
          transform: `translate(${dx}px, ${dy}px)`,
          transition: 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}>
          {tiles.map(tile => {
            const isPlayer   = tile.coord.q === playerPos.q && tile.coord.r === playerPos.r
            const isOpponent = mode === 'coop' && !!opponent &&
                               tile.coord.q === opponent.pos.q && tile.coord.r === opponent.pos.r
            const cost     = TERRAIN_MOVE_COST[tile.terrain]
            const canMove  = !combat && isNeighbor(playerPos, tile.coord)
                             && tile.terrain !== 'LAKE' && movePoints >= cost
            return (
              <HexTile
                key={tile.id} tile={tile}
                isPlayer={isPlayer} isOpponent={isOpponent}
                canMove={canMove} moveCost={canMove ? cost : undefined}
                onClick={() => handleClick(tile)}
              />
            )
          })}
        </g>

        {/* Mini compass */}
        <g transform="translate(660,460)">
          <circle cx={0} cy={0} r={16} fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          <text x={0} y={-7} textAnchor="middle" fontSize={8} fill="#6060a0">N</text>
          <text x={0} y={13} textAnchor="middle" fontSize={8} fill="#6060a0">S</text>
          <text x={-11} y={4} textAnchor="middle" fontSize={8} fill="#6060a0">W</text>
          <text x={11}  y={4} textAnchor="middle" fontSize={8} fill="#6060a0">E</text>
          <circle cx={0} cy={0} r={2} fill="#a855f7" />
        </g>
      </svg>

      {/* Bottom legend */}
      <div style={{
        position: 'absolute', bottom: 8, left: 8,
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {[
          { color: '#f59e0b', label: 'Move here' },
          { color: '#ef4444', label: 'Enemy' },
          { color: '#c084fc', label: 'You' },
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '3px 8px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: 10, color: '#7070a0' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
