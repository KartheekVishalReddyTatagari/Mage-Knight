import { create } from 'zustand'

export interface HexCoord { q: number; r: number }
export type TerrainType = 'PLAINS' | 'FOREST' | 'HILLS' | 'MOUNTAINS' | 'LAKE' | 'DESERT' | 'SWAMP'

export const TERRAIN_MOVE_COST: Record<TerrainType, number> = {
  PLAINS:    1, FOREST:    2, HILLS:     2,
  MOUNTAINS: 3, DESERT:    1, SWAMP:     2, LAKE: 99,
}

export interface TileData {
  id: string; coord: HexCoord; terrain: TerrainType
  revealed: boolean; hasEnemy: boolean
  enemyName?: string; enemyAttack?: number; enemyArmor?: number; enemyFame?: number
}

export interface CardData {
  instanceId: string; defId: string; name: string
  attack: number; block: number; move: number
  special?: string; rarity?: 'common' | 'uncommon' | 'rare'
}

export interface ItemData {
  id: string; defId: string; name: string; desc: string
  useIn: 'combat' | 'overworld' | 'any'
  effect: string; value: number
  rarity: 'common' | 'uncommon' | 'rare'
}

export interface CombatState {
  enemy: { name: string; attack: number; armor: number; fame: number }
  phase: 'FIGHTING' | 'RESULT'
  playerAttack: number; playerBlock: number
  result: 'WIN' | 'LOSE' | null
  fameGained: number; woundsTaken: number
  lootCard: CardData | null; itemDrop: ItemData | null
}

export interface OpponentState {
  playerId: string
  username: string
  pos: HexCoord
  fame: number
  level: number
  wounds: number
  handSizeMax: number
  movePoints: number
  movePointsMax: number
  itemCount: number
}

// ── WebSocket bridge ──────────────────────────────────────────────────────────
// Game.tsx sets this reference so store actions can push state updates to the WS.

let _wsSend: ((type: string, payload: Record<string, unknown>) => void) | null = null
export function setGlobalWsSend(fn: typeof _wsSend) { _wsSend = fn }

function syncStateToWs() {
  if (!_wsSend) return
  const s = useGameStore.getState()
  if (s.mode !== 'coop') return
  _wsSend('state_sync', {
    state: {
      pos:           s.playerPos,
      fame:          s.fame,
      level:         s.level,
      wounds:        s.wounds,
      handSizeMax:   s.handSizeMax,
      movePoints:    s.movePoints,
      movePointsMax: s.movePointsMax,
      itemCount:     s.items.length,
    },
    tiles: s.tiles,
  })
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

// ── Enemy tiers ───────────────────────────────────────────────────────────────

const ENEMY_TIERS = [
  [],
  [
    { name: 'Goblin Scout',   attack: 1, armor: 1, fame: 1 },
    { name: 'Wolf',           attack: 2, armor: 1, fame: 2 },
    { name: 'Orc Grunt',      attack: 2, armor: 2, fame: 2 },
  ],
  [
    { name: 'Orc Warrior',    attack: 3, armor: 3, fame: 3 },
    { name: 'Wolf Rider',     attack: 4, armor: 2, fame: 3 },
    { name: 'Orc Shaman',     attack: 2, armor: 3, fame: 3 },
    { name: 'Plague Rat',     attack: 3, armor: 2, fame: 2 },
  ],
  [
    { name: 'Guardian Golem', attack: 3, armor: 5, fame: 5 },
    { name: 'Ice Witch',      attack: 4, armor: 3, fame: 5 },
    { name: 'Troll Warrior',  attack: 5, armor: 4, fame: 6 },
    { name: 'Siege Golem',    attack: 4, armor: 6, fame: 6 },
  ],
  [
    { name: 'Dragon Whelp',   attack: 5, armor: 6, fame: 8 },
    { name: 'Dark Mage',      attack: 4, armor: 5, fame: 7 },
    { name: 'Necromancer',    attack: 6, armor: 5, fame: 9 },
    { name: 'Wyvern',         attack: 6, armor: 6, fame: 9 },
  ],
  [
    { name: 'Ancient Dragon', attack: 7, armor: 8, fame: 12 },
    { name: 'Shadow Lord',    attack: 8, armor: 6, fame: 11 },
    { name: 'Lich King',      attack: 6, armor: 9, fame: 13 },
    { name: 'Void Titan',     attack: 8, armor: 8, fame: 14 },
  ],
]

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
      const enemyChance = ring === 0 ? 0 : 0.15 + ring * 0.07
      const hasEnemy    = ring > 0 && terrain !== 'LAKE' && Math.random() < enemyChance
      tiles.push({
        id: `t${idx++}`, coord, terrain, revealed: ring === 0,
        hasEnemy, ...(hasEnemy ? makeEnemyTile(ring) : {}),
      })
    }
  }
  return tiles
}

// ── Item system ───────────────────────────────────────────────────────────────

type ItemDef = Omit<ItemData, 'id'>

const ITEM_DEFS: Record<string, ItemDef> = {
  health_potion:    { defId: 'health_potion',    name: 'Health Potion',    desc: 'Restore 1 wound.',          useIn: 'any',       effect: 'heal',     value: 1, rarity: 'common'   },
  war_elixir:       { defId: 'war_elixir',       name: 'War Elixir',       desc: '+3 Attack this combat.',    useIn: 'combat',    effect: 'atk_flat', value: 3, rarity: 'common'   },
  iron_tonic:       { defId: 'iron_tonic',       name: 'Iron Tonic',       desc: '+3 Block this combat.',     useIn: 'combat',    effect: 'blk_flat', value: 3, rarity: 'common'   },
  swift_boots:      { defId: 'swift_boots',      name: 'Swift Boots',      desc: '+3 Move points.',           useIn: 'overworld', effect: 'move',     value: 3, rarity: 'common'   },
  mana_crystal:     { defId: 'mana_crystal',     name: 'Mana Crystal',     desc: '+2 Attack & +2 Block.',     useIn: 'combat',    effect: 'atk_blk',  value: 2, rarity: 'uncommon' },
  rage_stone:       { defId: 'rage_stone',       name: 'Rage Stone',       desc: 'Double your Attack.',       useIn: 'combat',    effect: 'atk_mult', value: 2, rarity: 'uncommon' },
  smoke_bomb:       { defId: 'smoke_bomb',       name: 'Smoke Bomb',       desc: 'Negate all enemy damage.',  useIn: 'combat',    effect: 'blk_max',  value: 0, rarity: 'uncommon' },
  dragon_blood:     { defId: 'dragon_blood',     name: 'Dragon Blood',     desc: '+6 Attack this combat.',    useIn: 'combat',    effect: 'atk_flat', value: 6, rarity: 'rare'     },
  arcane_mirror:    { defId: 'arcane_mirror',    name: 'Arcane Mirror',    desc: '+5 Block this combat.',     useIn: 'combat',    effect: 'blk_flat', value: 5, rarity: 'rare'     },
  elixir_of_power:  { defId: 'elixir_of_power',  name: 'Elixir of Power',  desc: '+4 Attack & +4 Block.',     useIn: 'combat',    effect: 'atk_blk',  value: 4, rarity: 'rare'     },
}

const ITEM_POOL = {
  common:   ['health_potion', 'war_elixir', 'iron_tonic', 'swift_boots'] as const,
  uncommon: ['mana_crystal', 'rage_stone', 'smoke_bomb'] as const,
  rare:     ['dragon_blood', 'arcane_mirror', 'elixir_of_power'] as const,
}

function makeItem(defId: string): ItemData {
  return { ...ITEM_DEFS[defId], id: uid() }
}

function explorationDrop(ring: number): ItemData | null {
  if (Math.random() > 0.12) return null
  const r = Math.random()
  if (ring <= 1)             return makeItem(rnd([...ITEM_POOL.common]))
  if (ring <= 2 || r < 0.6) return makeItem(rnd([...ITEM_POOL.common]))
  if (ring <= 4 || r < 0.85) return makeItem(rnd([...ITEM_POOL.uncommon]))
  return makeItem(rnd([...ITEM_POOL.rare]))
}

function enemyDrop(ring: number): ItemData | null {
  const chance = 0.25 + ring * 0.05
  if (Math.random() > chance) return null
  const r = Math.random()
  if (ring <= 2)              return makeItem(rnd([...ITEM_POOL.common]))
  if (ring <= 3 || r < 0.55) return makeItem(rnd([...ITEM_POOL.common, ...ITEM_POOL.uncommon]))
  if (ring <= 4 || r < 0.8)  return makeItem(rnd([...ITEM_POOL.uncommon]))
  return makeItem(rnd([...ITEM_POOL.rare]))
}

// ── Card pools ────────────────────────────────────────────────────────────────

const BASE_DECK: Omit<CardData, 'instanceId'>[] = [
  { defId: 'rage',           name: 'Rage',           attack: 2, block: 0, move: 0, rarity: 'common' },
  { defId: 'rage',           name: 'Rage',           attack: 2, block: 0, move: 0, rarity: 'common' },
  { defId: 'determination',  name: 'Determination',  attack: 0, block: 2, move: 0, rarity: 'common' },
  { defId: 'determination',  name: 'Determination',  attack: 0, block: 2, move: 0, rarity: 'common' },
  { defId: 'concentration',  name: 'Concentration',  attack: 1, block: 1, move: 0, rarity: 'common' },
  { defId: 'concentration',  name: 'Concentration',  attack: 1, block: 1, move: 0, rarity: 'common' },
  { defId: 'battle_cry',     name: 'Battle Cry',     attack: 2, block: 0, move: 0, rarity: 'common' },
  { defId: 'shield_wall',    name: 'Shield Wall',    attack: 0, block: 2, move: 0, rarity: 'common' },
  { defId: 'improvisation',  name: 'Improvisation',  attack: 2, block: 1, move: 0, rarity: 'common' },
  { defId: 'cold_toughness', name: 'Cold Toughness', attack: 0, block: 2, move: 0, rarity: 'common' },
]

export const LOOT_POOL: Omit<CardData, 'instanceId'>[] = [
  { defId: 'threatening_aura',   name: 'Threatening Aura',   attack: 3, block: 0, move: 0, rarity: 'uncommon' },
  { defId: 'battle_versatility', name: 'Battle Versatility',  attack: 2, block: 2, move: 0, rarity: 'uncommon' },
  { defId: 'iron_will',          name: 'Iron Will',           attack: 0, block: 4, move: 0, rarity: 'uncommon' },
  { defId: 'parry',              name: 'Parry',               attack: 1, block: 2, move: 0, rarity: 'uncommon' },
  { defId: 'savage_strike',      name: 'Savage Strike',       attack: 4, block: 0, move: 0, rarity: 'uncommon' },
  { defId: 'bladestorm',         name: 'Bladestorm',          attack: 2, block: 1, move: 0, rarity: 'uncommon' },
  { defId: 'war_cry',            name: 'War Cry',             attack: 3, block: 1, move: 0, rarity: 'uncommon' },
  { defId: 'shield_bash',        name: 'Shield Bash',         attack: 1, block: 3, move: 0, rarity: 'uncommon' },
  { defId: 'promise',            name: 'Promise',             attack: 0, block: 3, move: 0, rarity: 'uncommon' },
  { defId: 'tranquility',        name: 'Tranquility',         attack: 0, block: 0, move: 0, rarity: 'rare',     special: 'heal1' },
  { defId: 'heroic_tale',        name: 'Heroic Tale',         attack: 2, block: 2, move: 0, rarity: 'rare' },
  { defId: 'blood_rage',         name: 'Blood Rage',          attack: 5, block: 0, move: 0, rarity: 'rare' },
  { defId: 'arcane_shield',      name: 'Arcane Shield',       attack: 0, block: 5, move: 0, rarity: 'rare' },
  { defId: 'lightning_bolt',     name: 'Lightning Bolt',      attack: 5, block: 0, move: 0, rarity: 'rare' },
  { defId: 'nova_blast',         name: 'Nova Blast',          attack: 6, block: 0, move: 0, rarity: 'rare' },
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

// ── Store interface ───────────────────────────────────────────────────────────

const BASE_MOVE = 4

interface GameStore {
  sessionId: string | null; playerPos: HexCoord; tiles: TileData[]
  hand: CardData[]; discard: CardData[]
  items: ItemData[]
  fame: number; level: number; wounds: number; handSizeMax: number
  movePoints: number; movePointsMax: number
  combat: CombatState | null; gameOver: boolean; levelUpMessage: string | null
  turnCount: number; log: string[]

  // Multiplayer state
  mode: 'solo' | 'coop'
  myPlayerId: string | null
  currentTurnPlayerId: string | null
  opponent: OpponentState | null

  setSession: (id: string) => void
  movePlayer: (coord: HexCoord) => void
  playCardInCombat: (instanceId: string) => void
  useItem: (id: string) => void
  resolveCombat: () => void; dismissCombat: () => void
  endTurn: () => void; restartGame: () => void; addLog: (msg: string) => void

  // Multiplayer actions
  initMultiplayer: (myPlayerId: string, firstTurnId: string, opp: { id: string; username: string }) => void
  syncOpponent: (from: string, state: any, tiles?: any[]) => void
  replaceTiles: (tiles: TileData[]) => void
  handleTurnChanged: (newTurnId: string) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => {
  const init = buildStartingState()
  return {
    sessionId: null, playerPos: { q: 0, r: 0 },
    tiles: init.tiles, hand: init.hand, discard: init.discard,
    items: [],
    fame: 0, level: 1, wounds: 0, handSizeMax: 5,
    movePoints: BASE_MOVE, movePointsMax: BASE_MOVE,
    combat: null, gameOver: false, levelUpMessage: null,
    turnCount: 0, log: ['The quest begins. Explore the world!'],

    // Multiplayer defaults
    mode: 'solo', myPlayerId: null, currentTurnPlayerId: null, opponent: null,

    setSession: (id) => set({ sessionId: id }),
    addLog: (msg) => set(s => ({ log: [msg, ...s.log].slice(0, 25) })),

    // ── Multiplayer actions ───────────────────────────────────────────────────

    initMultiplayer: (myPlayerId, firstTurnId, opp) => {
      set({
        mode: 'coop',
        myPlayerId,
        currentTurnPlayerId: firstTurnId,
        opponent: {
          playerId: opp.id, username: opp.username,
          pos: { q: 0, r: 0 }, fame: 0, level: 1, wounds: 0,
          handSizeMax: 5, movePoints: BASE_MOVE, movePointsMax: BASE_MOVE, itemCount: 0,
        },
      })
      get().addLog(`⚔ Co-op quest begins! Playing with ${opp.username}`)
    },

    syncOpponent: (from, state, tiles) => {
      set(cur => {
        const existingOpp = cur.opponent
        if (!existingOpp) return {}
        const newOpp: OpponentState = { ...existingOpp, ...state, playerId: from }
        // Merge tiles: adopt any tiles the opponent has revealed that we haven't
        const newTiles = tiles
          ? cur.tiles.map(local => {
              const remote = (tiles as any[]).find(
                rt => rt.coord.q === local.coord.q && rt.coord.r === local.coord.r
              )
              if (!remote || !remote.revealed) return local
              if (remote.revealed && !local.revealed) return { ...local, ...remote, id: local.id }
              // If both revealed, sync enemy state (enemy may have been defeated)
              if (local.revealed) return { ...local, hasEnemy: remote.hasEnemy, enemyName: remote.enemyName, enemyAttack: remote.enemyAttack, enemyArmor: remote.enemyArmor, enemyFame: remote.enemyFame }
              return local
            })
          : cur.tiles
        return { opponent: newOpp, tiles: newTiles }
      })
    },

    replaceTiles: (tiles) => set({ tiles }),

    handleTurnChanged: (newTurnId) => {
      set({ currentTurnPlayerId: newTurnId })
      const s = get()
      const isMyTurn = newTurnId === s.myPlayerId
      get().addLog(isMyTurn ? '⚡ Your turn!' : `⏳ ${s.opponent?.username ?? 'Opponent'}'s turn`)
    },

    // ── Game actions ──────────────────────────────────────────────────────────

    movePlayer: (coord) => {
      const s = get()
      if (s.combat || s.gameOver) return
      // Block moves when it's not your turn in coop
      if (s.mode === 'coop' && s.myPlayerId !== s.currentTurnPlayerId) return
      if (!isNeighbor(s.playerPos, coord)) return
      const tile = s.tiles.find(t => t.coord.q === coord.q && t.coord.r === coord.r)
      if (!tile || tile.terrain === 'LAKE') return

      const cost = TERRAIN_MOVE_COST[tile.terrain]
      if (s.movePoints < cost) {
        get().addLog(`⛔ Not enough moves (need ${cost}, have ${s.movePoints})`)
        return
      }

      const isNewTile = !tile.revealed

      set(cur => ({
        playerPos: coord,
        movePoints: cur.movePoints - cost,
        tiles: cur.tiles.map(t => {
          if (t.coord.q === coord.q && t.coord.r === coord.r) return { ...t, revealed: true }
          if (isNeighbor(coord, t.coord)) return { ...t, revealed: true }
          return t
        }),
      }))
      get().addLog(`Moved to ${tile.terrain.toLowerCase()} [-${cost} move]`)

      // Item discovery on first visit to non-enemy tiles
      if (isNewTile && !tile.hasEnemy) {  // LAKE already filtered above
        const ring = Math.round(hexDist({ q: 0, r: 0 }, coord))
        const drop = explorationDrop(ring)
        if (drop) {
          set(cur => ({ items: [...cur.items, drop] }))
          get().addLog(`🎁 Found a ${drop.name} while exploring!`)
        }
      }

      if (tile.hasEnemy) {
        set({
          combat: {
            enemy: {
              name: tile.enemyName ?? 'Unknown', attack: tile.enemyAttack ?? 2,
              armor: tile.enemyArmor ?? 2, fame: tile.enemyFame ?? 1,
            },
            phase: 'FIGHTING', playerAttack: 0, playerBlock: 0,
            result: null, fameGained: 0, woundsTaken: 0, lootCard: null, itemDrop: null,
          },
        })
        get().addLog(`⚔ ${tile.enemyName} appears!`)
      }

      // Sync updated state (position + revealed tiles) to opponent
      if (get().mode === 'coop') syncStateToWs()
    },

    playCardInCombat: (instanceId) => {
      const s = get()
      if (!s.combat || s.combat.phase !== 'FIGHTING') return
      if (s.mode === 'coop' && s.myPlayerId !== s.currentTurnPlayerId) return
      const card = s.hand.find(c => c.instanceId === instanceId)
      if (!card) return
      const healAmt = card.special === 'heal1' ? 1 : 0
      set(cur => ({
        hand: cur.hand.filter(c => c.instanceId !== instanceId),
        discard: [...cur.discard, card],
        wounds: Math.max(0, cur.wounds - healAmt),
        combat: cur.combat ? {
          ...cur.combat,
          playerAttack: cur.combat.playerAttack + card.attack,
          playerBlock:  cur.combat.playerBlock  + card.block,
        } : null,
      }))
      if (healAmt > 0) get().addLog('💚 Tranquility — healed 1 wound!')
    },

    useItem: (id) => {
      const s = get()
      if (s.mode === 'coop' && s.myPlayerId !== s.currentTurnPlayerId) return
      const item = s.items.find(i => i.id === id)
      if (!item) return
      const inCombat = !!s.combat && s.combat.phase === 'FIGHTING'
      if (item.useIn === 'combat'    && !inCombat) return
      if (item.useIn === 'overworld' && inCombat)  return

      set(cur => ({ items: cur.items.filter(i => i.id !== id) }))

      switch (item.effect) {
        case 'heal':
          set(cur => ({ wounds: Math.max(0, cur.wounds - item.value) }))
          get().addLog(`🧪 ${item.name} — healed ${item.value} wound(s)!`)
          break
        case 'move':
          set(cur => ({ movePoints: cur.movePoints + item.value }))
          get().addLog(`👟 ${item.name} — +${item.value} move points!`)
          break
        case 'atk_flat':
          if (inCombat) set(cur => ({
            combat: cur.combat
              ? { ...cur.combat, playerAttack: cur.combat.playerAttack + item.value }
              : null,
          }))
          get().addLog(`⚗️ ${item.name} — +${item.value} attack!`)
          break
        case 'blk_flat':
          if (inCombat) set(cur => ({
            combat: cur.combat
              ? { ...cur.combat, playerBlock: cur.combat.playerBlock + item.value }
              : null,
          }))
          get().addLog(`🫙 ${item.name} — +${item.value} block!`)
          break
        case 'atk_blk':
          if (inCombat) set(cur => ({
            combat: cur.combat
              ? {
                  ...cur.combat,
                  playerAttack: cur.combat.playerAttack + item.value,
                  playerBlock:  cur.combat.playerBlock  + item.value,
                }
              : null,
          }))
          get().addLog(`✨ ${item.name} — +${item.value} ATK & BLK!`)
          break
        case 'atk_mult':
          if (inCombat) set(cur => ({
            combat: cur.combat
              ? { ...cur.combat, playerAttack: Math.round(cur.combat.playerAttack * item.value) }
              : null,
          }))
          get().addLog(`🔴 ${item.name} — Attack doubled!`)
          break
        case 'blk_max':
          if (inCombat && s.combat) set(cur => ({
            combat: cur.combat
              ? { ...cur.combat, playerBlock: s.combat!.enemy.attack }
              : null,
          }))
          get().addLog(`💨 ${item.name} — All enemy damage negated!`)
          break
      }
      if (get().mode === 'coop') syncStateToWs()
    },

    resolveCombat: () => {
      const s = get()
      if (!s.combat) return
      if (s.mode === 'coop' && s.myPlayerId !== s.currentTurnPlayerId) return
      const { enemy, playerAttack, playerBlock } = s.combat
      const won         = playerAttack >= enemy.armor
      const unblocked   = Math.max(0, enemy.attack - playerBlock)
      const woundsTaken = won ? 0 : unblocked

      const lootCard: CardData | null = won
        ? { ...rnd(LOOT_POOL), instanceId: uid() }
        : null

      const ring = Math.round(hexDist({ q: 0, r: 0 }, s.playerPos))
      const itemDrop: ItemData | null = won ? enemyDrop(ring) : null

      const newFame        = won ? s.fame + enemy.fame : s.fame
      const newWounds      = s.wounds + woundsTaken
      const newLevel       = levelForFame(newFame)
      const leveledUp      = newLevel > s.level
      const evenLevel      = leveledUp && newLevel % 2 === 0
      const newHandSizeMax = s.handSizeMax + (evenLevel ? 1 : 0)
      const newMoveMax     = s.movePointsMax + (evenLevel ? 1 : 0)
      const gameOver       = newWounds >= newHandSizeMax
      const lvlMsg         = leveledUp
        ? `Level ${newLevel}! ${evenLevel ? '+1 hand size & +1 move' : 'Growing stronger'}`
        : null

      set({
        fame: newFame, level: newLevel,
        wounds: newWounds, handSizeMax: newHandSizeMax,
        movePointsMax: newMoveMax, gameOver,
        levelUpMessage: lvlMsg,
        discard: lootCard ? [...s.discard, lootCard] : s.discard,
        items: itemDrop ? [...s.items, itemDrop] : s.items,
        combat: {
          ...s.combat, phase: 'RESULT',
          result: won ? 'WIN' : 'LOSE',
          fameGained: won ? enemy.fame : 0, woundsTaken, lootCard, itemDrop,
        },
      })
      if (won)       get().addLog(`✅ Defeated ${enemy.name}! +${enemy.fame} fame`)
      if (itemDrop)  get().addLog(`🎁 Looted: ${itemDrop.name}!`)
      else           get().addLog(`💀 Failed — took ${woundsTaken} wound(s)`)
      if (leveledUp) get().addLog(`🌟 LEVEL UP → ${newLevel}!`)
      if (gameOver)  get().addLog('☠ Knocked out!')

      if (get().mode === 'coop') syncStateToWs()
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
      if (get().mode === 'coop') syncStateToWs()
    },

    endTurn: () => {
      const s = get()
      if (s.combat || s.gameOver) return
      if (s.mode === 'coop' && s.myPlayerId !== s.currentTurnPlayerId) return
      const newTurn = s.turnCount + 1
      let tiles = s.tiles
      if (newTurn % 10 === 0) {
        tiles = tiles.map(tile => {
          if (!tile.revealed || tile.hasEnemy || tile.terrain === 'LAKE') return tile
          const fromCenter = hexDist({ q: 0, r: 0 }, tile.coord)
          const fromPlayer = hexDist(s.playerPos, tile.coord)
          if (fromCenter < 2 || fromPlayer < 3) return tile
          if (Math.random() < 0.45) {
            const ring = Math.min(Math.round(fromCenter), 5)
            return { ...tile, ...makeEnemyTile(ring) }
          }
          return tile
        })
        get().addLog('⚠ Enemies have respawned across the land!')
      }
      const all      = shuffle([...s.hand, ...s.discard])
      const newHand  = all.slice(0, s.handSizeMax)
      const newDiscard = all.slice(s.handSizeMax)
      set({ hand: newHand, discard: newDiscard, tiles, turnCount: newTurn, movePoints: s.movePointsMax })
      get().addLog(`Turn ${newTurn} — ${newHand.length} cards, ${s.movePointsMax} moves`)

      // In coop: tell server to switch turns; optimistically update local turn
      if (s.mode === 'coop') {
        if (_wsSend) _wsSend('end_turn', {})
        set(cur => ({ currentTurnPlayerId: cur.opponent?.playerId ?? null }))
        syncStateToWs()
      }
    },

    restartGame: () => {
      const init = buildStartingState()
      set({
        playerPos: { q:0, r:0 }, tiles: init.tiles,
        hand: init.hand, discard: init.discard, items: [],
        fame: 0, level: 1, wounds: 0, handSizeMax: 5,
        movePoints: BASE_MOVE, movePointsMax: BASE_MOVE,
        combat: null, gameOver: false, levelUpMessage: null,
        turnCount: 0, log: ['New game — good luck!'],
        mode: 'solo', myPlayerId: null, currentTurnPlayerId: null, opponent: null,
      })
    },
  }
})
