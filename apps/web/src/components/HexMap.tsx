import { useCallback } from 'react'
import { useGameStore, HexCoord, TileData } from '../store/gameStore'

const HEX_SIZE = 44
const SQRT3 = Math.sqrt(3)
const CX = 350
const CY = 280

const TERRAIN_COLOR: Record<string, { fill: string; stroke: string }> = {
  PLAINS:    { fill: '#2d5a1e', stroke: '#4a8a30' },
  FOREST:    { fill: '#0d3318', stroke: '#1a5224' },
  HILLS:     { fill: '#5a3a1a', stroke: '#8a5a28' },
  MOUNTAINS: { fill: '#2e3644', stroke: '#4a5670' },
  LAKE:      { fill: '#0a2456', stroke: '#1a3a86' },
  DESERT:    { fill: '#7a4e08', stroke: '#c07a14' },
  SWAMP:     { fill: '#1a3010', stroke: '#2e5020' },
}

const TERRAIN_EMOJI: Record<string, string> = {
  PLAINS:    '🌿', FOREST: '🌲', HILLS: '⛰',
  MOUNTAINS: '🗻', LAKE:   '🌊', DESERT: '🏜',
  SWAMP:     '🌾',
}

function hexToPixel(q: number, r: number) {
  return {
    x: CX + HEX_SIZE * (SQRT3 * q + SQRT3 / 2 * r),
    y: CY + HEX_SIZE * (3 / 2 * r),
  }
}

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    pts.push(`${(cx + size * Math.cos(a)).toFixed(1)},${(cy + size * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const HEX_DIRS: HexCoord[] = [
  { q: 1, r: 0 }, { q: -1, r: 0 },
  { q: 0, r: 1 }, { q: 0, r: -1 },
  { q: 1, r: -1 }, { q: -1, r: 1 },
]
function isNeighbor(a: HexCoord, b: HexCoord) {
  return HEX_DIRS.some(d => a.q + d.q === b.q && a.r + d.r === b.r)
}

function HexTile({ tile, isPlayer, canMove, onClick }: {
  tile: TileData; isPlayer: boolean; canMove: boolean; onClick: () => void
}) {
  const { x, y } = hexToPixel(tile.coord.q, tile.coord.r)
  const colors = TERRAIN_COLOR[tile.terrain]
  const inner  = HEX_SIZE - 2
  const outer  = HEX_SIZE - 0.5

  return (
    <g onClick={onClick} style={{ cursor: canMove ? 'pointer' : 'default' }}>

      {/* Shadow / depth */}
      <polygon
        points={hexPoints(x, y + 2, outer)}
        fill="rgba(0,0,0,0.35)"
      />

      {/* Tile fill */}
      <polygon
        points={hexPoints(x, y, inner)}
        fill={tile.revealed ? colors.fill : '#07071a'}
        stroke={canMove ? '#f59e0b' : isPlayer ? '#ffffff' : tile.revealed ? colors.stroke : '#1a1a30'}
        strokeWidth={canMove ? 2.5 : isPlayer ? 2.5 : 1}
        opacity={tile.revealed ? 1 : 0.7}
      />

      {/* Move highlight pulse ring */}
      {canMove && (
        <polygon
          points={hexPoints(x, y, outer + 1)}
          fill="none"
          stroke="#f59e0b"
          strokeWidth={3}
          opacity={0.3}
          strokeDasharray="4 4"
        />
      )}

      {/* Fog overlay */}
      {!tile.revealed && (
        <>
          <polygon points={hexPoints(x, y, inner)} fill="rgba(7,7,26,0.6)" />
          <text x={x} y={y + 7} textAnchor="middle" fontSize={22} fill="#1e1e38"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>?</text>
        </>
      )}

      {/* Terrain emoji + label */}
      {tile.revealed && (
        <>
          <text x={x} y={y - 6} textAnchor="middle" fontSize={16}
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {TERRAIN_EMOJI[tile.terrain]}
          </text>
          <text x={x} y={y + 14} textAnchor="middle" fontSize={8} fill="rgba(255,255,255,0.45)"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {tile.terrain}
          </text>
        </>
      )}

      {/* Enemy marker */}
      {tile.revealed && tile.hasEnemy && (
        <g style={{ pointerEvents: 'none' }}>
          <circle cx={x + 17} cy={y - 18} r={11}
            fill="radial-gradient(circle, #ff4444, #cc0000)" stroke="#ff6666" strokeWidth={1.5} />
          <circle cx={x + 17} cy={y - 18} r={11}
            fill="#cc2222" stroke="#ff4444" strokeWidth={1.5} />
          <text x={x + 17} y={y - 13} textAnchor="middle" fontSize={11} fill="white">⚔</text>
        </g>
      )}

      {/* Player avatar */}
      {isPlayer && (
        <g style={{ pointerEvents: 'none' }}>
          {/* Glow ring */}
          <circle cx={x} cy={y - 12} r={15} fill="rgba(168,85,247,0.15)" />
          {/* Avatar circle */}
          <circle cx={x} cy={y - 12} r={12}
            fill="url(#playerGrad)" stroke="#a855f7" strokeWidth={2} />
          <text x={x} y={y - 7} textAnchor="middle" fontSize={13} fill="white">♞</text>
        </g>
      )}
    </g>
  )
}

export function HexMap() {
  const { tiles, playerPos, combat, movePlayer } = useGameStore()

  const handleClick = useCallback((tile: TileData) => {
    if (combat) return
    movePlayer(tile.coord)
  }, [combat, movePlayer])

  return (
    <div style={{
      flex: 1,
      overflow: 'auto',
      background: 'radial-gradient(ellipse at center, #0e0e24 0%, #07071a 100%)',
      borderRadius: 10,
      border: '1px solid rgba(124,58,237,0.15)',
      boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
    }}>
      <svg
        viewBox="0 0 700 560"
        width="100%"
        style={{ display: 'block', minHeight: 380 }}
      >
        <defs>
          <radialGradient id="playerGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#7c3aed" />
          </radialGradient>
          <filter id="glow-player">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Stars / space background */}
        {[...Array(30)].map((_, i) => {
          const px = (i * 137.508) % 700
          const py = (i * 97.3)   % 560
          return <circle key={i} cx={px} cy={py} r={0.6} fill="rgba(255,255,255,0.15)" />
        })}

        {tiles.map(tile => {
          const isPlayer = tile.coord.q === playerPos.q && tile.coord.r === playerPos.r
          const canMove  = !combat && isNeighbor(playerPos, tile.coord) && tile.terrain !== 'LAKE'
          return (
            <HexTile
              key={tile.id}
              tile={tile}
              isPlayer={isPlayer}
              canMove={canMove}
              onClick={() => handleClick(tile)}
            />
          )
        })}
      </svg>
    </div>
  )
}
