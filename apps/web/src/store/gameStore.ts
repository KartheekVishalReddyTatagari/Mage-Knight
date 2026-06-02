import { create } from 'zustand'

export interface HexCoord { q: number; r: number }
export type TerrainType = 'PLAINS' | 'FOREST' | 'HILLS' | 'MOUNTAINS' | 'LAKE' | 'DESERT' | 'SWAMP'

export interface TileData {
  id: string; coord: HexCoord; terrain: TerrainType
  revealed: boolean; hasEnemy: boolean
  enemyName?: string; enemyAttack?: number; enemyArmor?: number; enemyFame?: number
}

export interface CardData {
  instanceId: string; defId: string; name: string
  attack: number; block: number; move: number
}

export interface CombatState {
  enemy: { name: string; attack: number; armor: number; fame: number }
  phase: 'FIGHTING' | 'RESULT'
  playerAttack: number; playerBlock: number
  result: 'WIN' | 'LOSE' | null
  fameGained: number; woundsTaken: number; lootCard: CardData | null
}

interface GameStore {
  sessionId: string | null; playerPos: HexCoord; tiles: TileData[]
  hand: CardData[]; discard: CardData[]
  fame: number; level: number; wounds: number; handSizeMax: number
  combat: CombatState | null; gameOver: boolean; levelUpMessage: string | null
  turnCount: number; log: string[]
  setSession: (id: string) => void
  movePlayer: (coord: HexCoord) => void
  playCardInCombat: (instanceId: string) => void
  resolveCombat: () => void; dismissCombat: () => void
  endTurn: () => void; restartGame: () => void; addLog: (msg: string) => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hexDist(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function rnd<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function uid() { return Math.random().toString(36).slice(2) }

const FAME_THRESHOLDS = [0, 3, 8, 14, 21, 30, 40]
function levelForFame(f: number) {
  let l = 1
  for (let i = 1; i < FAME_THRESHOLDS.length; i++) if (f >= FAME_THRESHOLDS[i]) l = i + 1
  return Math.min(l, 7)
}

// ── Enemy tiers (by ring distance) ───────────────────────────────────────────

const ENEMY_TIERS = [
  [], // ring 0 - no enemies
  [   // ring 1 - weak
    { name: 'Goblin Scout',   attack: 1, armor: 1, fame: 1 },
    { name: 'Wolf',           attack: 2, armor: 1, fame: 2 },
    { name: 'Orc Grunt',      attack: 2, armor: 2, fame: 2 },
  ],
  [   // ring 2 - medium
    { name: 'Orc Warrior',    attack: 3, armor: 3, fame: 3 },
    { name: 'Wolf Rider',     attack: 4, armor: 2, fame: 3 },
    { name: 'Orc Shaman',     attack: 2, armor: 3, fame: 3 },
    { name: 'Plague Rat',     attack: 3, armor: 2, fame: 2 },
  ],
  [   // ring 3 - hard
    { name: 'Guardian Golem', attack: 3, armor: 5, fame: 5 },
    { name: 'Ice Witch',      attack: 4, armor: 3, fame: 5 },
    { name: 'Troll Warrior',  attack: 5, armor: 4, fame: 6 },
    { name: 'Siege Golem',    attack: 4, armor: 6, fame: 6 },
  ],
  [   // ring 4 - elite
    { name: 'Dragon Whelp',   attack: 5, armor: 6, fame: 8 },
    { name: 'Dark Mage',      attack: 4, armor: 5, fame: 7 },
    { name: 'Necromancer',    attack: 6, armor: 5, fame: 9 },
    { name: 'Wyvern',         attack: 6, armor: 6, fame: 9 },
  ],
  [   // ring 5 - boss
    { name: 'Ancient Dragon', attack: 7, armor: 8, fame: 12 },
    { name: 'Shadow Lord',    attack: 8, armor: 6, fame: 11 },
    { name: 'Lich King',      attack: 6, armor: 9, fame: 13 },
    { name: 'Void Titan',     attack: 8, armor: 8, fame: 14 },
  ],
]

// ── Terrain pools per ring ────────────────────────────────────────────────────

const TERRAIN_POOLS: TerrainType[][] = [
  ['PLAINS'],
  ['PLAINS','PLAINS','FOREST','FOREST','HILLS','LAKE'],
  ['FOREST','FOREST','HILLS','HILLS','PLAINS','LAKE'],
  ['HILLS','HILLS','MOUNTAINS','FOREST','DESERT','SWAMP'],
  ['MOUNTAINS','MOUNTAINS','DESERT','SWAMP','HILLS','LAKE'],
  ['MOUNTAINS','DESERT','SWAMP','SWAMP','MOUNTAINS','LAKE'],
]

function makeEnemyTile(ring: number): Partial<TileData> {
  const tier = Math.min(ring, 5)
  const t = rnd(ENEMY_TIERS[tier] as { name: string; attack: number; armor: number; fame: number }[])
  return { hasEnemy: true, enemyName: t.name, enemyAttack: t.attack, enemyArmor: t.armor, enemyFame: t.fame }
}

// ── Map generation ────────────────────────────────────────────────────────────

function generateMap(): TileData[] {
  const MAX_RING = 5
  const origin = { q: 0, r: 0 }
  const tiles: TileData[] = []
  let idx = 0

  for (let q = -MAX_RING; q <= MAX_RING; q++) {
    for (let r = -MAX_RING; r <= MAX_RING; r++) {
      const coord = { q, r }
      const dist = hexDist(origin, coord)
      if (dist > MAX_RING) continue

      const ring    = Math.round(dist)
      const terrain = ring === 0 ? 'PLAINS' : rnd(TERRAIN_POOLS[ring])

      // Enemy density scales with ring: 22% → 50%
      const enemyChance = ring === 0 ? 0 : 0.15 + ring * 0.07
      const hasEnemy    = ring > 0 && terrain !== 'LAKE' && Math.random() < enemyChance

      tiles.push({
        id: `t${idx++}`, coord, terrain, revealed: ring === 0,
        hasEnemy,
        ...(hasEnemy ? makeEnemyTile(ring) : {}),
      })
    }
  }
  return tiles
}

// ── Loot pool ─────────────────────────────────────────────────────────────────

const LOOT_POOL: Omit<CardData, 'instanceId'>[] = [
  { defId: 'threatening_aura', name: 'Threatening Aura', attack: 3, block: 0, move: 0 },
  { defId: 'improvisation',    name: 'Improvisation',    attack: 2, block: 1, move: 0 },
  { defId: 'swiftness',        name: 'Swiftness',        attack: 1, block: 0, move: 2 },
  { defId: 'promise',          name: 'Promise',          attack: 0, block: 3, move: 0 },
  { defId: 'rage',             name: 'Rage',             attack: 2, block: 0, move: 0 },
  { defId: 'determination',    name: 'Determination',    attack: 0, block: 2, move: 0 },
]

// ── Starting deck ─────────────────────────────────────────────────────────────

const BASE_DECK: Omit<CardData, 'instanceId'>[] = [
  { defId: 'march',         name: 'March',         attack: 0, block: 0, move: 2 },
  { defId: 'march',         name: 'March',         attack: 0, block: 0, move: 2 },
  { defId: 'march',         name: 'March',         attack: 0, block: 0, move: 2 },
  { defId: 'rage',          name: 'Rage',          attack: 2, block: 0, move: 0 },
  { defId: 'determination', name: 'Determination', attack: 0, block: 2, move: 0 },
  { defId: 'concentration', name: 'Concentration', attack: 1, block: 1, move: 1 },
  { defId: 'concentration', name: 'Concentration', attack: 1, block: 1, move: 1 },
]

function buildStartingState() {
  const deck = shuffle(BASE_DECK.map(c => ({ ...c, instanceId: uid() })))
  return { hand: deck.slice(0, 5), discard: deck.slice(5), tiles: generateMap() }
}

const HEX_DIRS: HexCoord[] = [
  { q:1,r:0 },{ q:-1,r:0 },{ q:0,r:1 },{ q:0,r:-1 },{ q:1,r:-1 },{ q:-1,r:1 },
]
function isNeighbor(a: HexCoord, b: HexCoord) {
  return HEX_DIRS.some(d => a.q + d.q === b.q && a.r + d.r === b.r)
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => {
  const init = buildStartingState()
  return {
    sessionId: null, playerPos: { q: 0, r: 0 },
    tiles: init.tiles, hand: init.hand, discard: init.discard,
    fame: 0, level: 1, wounds: 0, handSizeMax: 5,
    combat: null, gameOver: false, levelUpMessage: null,
    turnCount: 0, log: ['The quest begins. Explore the world!'],

    setSession: (id) => set({ sessionId: id }),
    addLog: (msg) => set(s => ({ log: [msg, ...s.log].slice(0, 25) })),

    movePlayer: (coord) => {
      const s = get()
      if (s.combat || s.gameOver) return
      if (!isNeighbor(s.playerPos, coord)) return
      const tile = s.tiles.find(t => t.coord.q === coord.q && t.coord.r === coord.r)
      if (!tile || tile.terrain === 'LAKE') return

      set(cur => ({
        playerPos: coord,
        tiles: cur.tiles.map(t => {
          if (t.coord.q === coord.q && t.coord.r === coord.r) return { ...t, revealed: true }
          if (isNeighbor(coord, t.coord)) return { ...t, revealed: true }
          return t
        }),
      }))
      get().addLog(`Moved to ${tile.terrain.toLowerCase()} (${coord.q},${coord.r})`)

      if (tile.hasEnemy) {
        set({
          combat: {
            enemy: {
              name: tile.enemyName ?? 'Unknown', attack: tile.enemyAttack ?? 2,
              armor: tile.enemyArmor ?? 2, fame: tile.enemyFame ?? 1,
            },
            phase: 'FIGHTING', playerAttack: 0, playerBlock: 0,
            result: null, fameGained: 0, woundsTaken: 0, lootCard: null,
          },
        })
        get().addLog(`⚔ ${tile.enemyName} appears!`)
      }
    },

    playCardInCombat: (instanceId) => {
      const s = get()
      if (!s.combat || s.combat.phase !== 'FIGHTING') return
      const card = s.hand.find(c => c.instanceId === instanceId)
      if (!card) return
      set(cur => ({
        hand: cur.hand.filter(c => c.instanceId !== instanceId),
        discard: [...cur.discard, card],
        combat: cur.combat ? {
          ...cur.combat,
          playerAttack: cur.combat.playerAttack + card.attack,
          playerBlock:  cur.combat.playerBlock  + card.block,
        } : null,
      }))
    },

    resolveCombat: () => {
      const s = get()
      if (!s.combat) return
      const { enemy, playerAttack, playerBlock } = s.combat
      const won         = playerAttack >= enemy.armor
      const unblocked   = Math.max(0, enemy.attack - playerBlock)
      const woundsTaken = won ? 0 : unblocked

      const lootCard: CardData | null = won
        ? { ...rnd(LOOT_POOL), instanceId: uid() }
        : null

      const newFame        = won ? s.fame + enemy.fame : s.fame
      const newWounds      = s.wounds + woundsTaken
      const newLevel       = levelForFame(newFame)
      const leveledUp      = newLevel > s.level
      const newHandSizeMax = s.handSizeMax + (leveledUp && newLevel % 2 === 0 ? 1 : 0)
      const gameOver       = newWounds >= newHandSizeMax
      const lvlMsg         = leveledUp
        ? `Level ${newLevel}! ${newLevel % 2 === 0 ? '+1 hand size' : 'Growing stronger'}`
        : null

      set({
        fame: newFame, level: newLevel,
        wounds: newWounds, handSizeMax: newHandSizeMax,
        gameOver, levelUpMessage: lvlMsg,
        discard: lootCard ? [...s.discard, lootCard] : s.discard,
        combat: {
          ...s.combat, phase: 'RESULT',
          result: won ? 'WIN' : 'LOSE',
          fameGained: won ? enemy.fame : 0, woundsTaken, lootCard,
        },
      })
      if (won)      get().addLog(`✅ Defeated ${enemy.name}! +${enemy.fame} fame${lootCard ? `, got ${lootCard.name}` : ''}`)
      else          get().addLog(`💀 Failed — took ${woundsTaken} wound(s)`)
      if (leveledUp) get().addLog(`🌟 LEVEL UP → ${newLevel}!`)
      if (gameOver)  get().addLog('☠ Knocked out!')
    },

    dismissCombat: () => {
      const s = get()
      const won = s.combat?.result === 'WIN'
      set(cur => ({
        combat: null, levelUpMessage: null,
        tiles: won
          ? cur.tiles.map(t =>
              t.coord.q === cur.playerPos.q && t.coord.r === cur.playerPos.r
                ? { ...t, hasEnemy: false } : t)
          : cur.tiles,
      }))
    },

    endTurn: () => {
      const s = get()
      if (s.combat || s.gameOver) return
      const newTurn = s.turnCount + 1

      // Respawn enemies every 10 turns on cleared, far-away revealed tiles
      let tiles = s.tiles
      if (newTurn % 10 === 0) {
        tiles = tiles.map(tile => {
          if (!tile.revealed || tile.hasEnemy || tile.terrain === 'LAKE') return tile
          const fromCenter  = hexDist({ q: 0, r: 0 }, tile.coord)
          const fromPlayer  = hexDist(s.playerPos, tile.coord)
          if (fromCenter < 2 || fromPlayer < 3) return tile
          if (Math.random() < 0.45) {
            const ring = Math.min(Math.round(fromCenter), 5)
            return { ...tile, ...makeEnemyTile(ring) }
          }
          return tile
        })
        get().addLog('⚠ Enemies have respawned across the land!')
      }

      const all     = shuffle([...s.hand, ...s.discard])
      const newHand = all.slice(0, s.handSizeMax)
      const newDiscard = all.slice(s.handSizeMax)

      set({ hand: newHand, discard: newDiscard, tiles, turnCount: newTurn })
      get().addLog(`Turn ${newTurn} — hand refreshed (${newHand.length} cards)`)
    },

    restartGame: () => {
      const init = buildStartingState()
      set({
        playerPos: { q:0, r:0 }, tiles: init.tiles,
        hand: init.hand, discard: init.discard,
        fame: 0, level: 1, wounds: 0, handSizeMax: 5,
        combat: null, gameOver: false, levelUpMessage: null,
        turnCount: 0, log: ['New game — good luck!'],
      })
    },
  }
})
