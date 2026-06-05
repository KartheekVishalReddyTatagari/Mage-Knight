import { create } from 'zustand'

export interface HexCoord { q: number; r: number }
export type TerrainType = 'PLAINS' | 'FOREST' | 'HILLS' | 'MOUNTAINS' | 'LAKE' | 'DESERT' | 'SWAMP' | 'CITY'

export const TERRAIN_MOVE_COST: Record<TerrainType, number> = {
  PLAINS: 1, FOREST: 2, HILLS: 2, MOUNTAINS: 3, DESERT: 1, SWAMP: 2, LAKE: 99, CITY: 1,
}

export interface TileData {
  id: string; coord: HexCoord; terrain: TerrainType
  revealed: boolean; hasEnemy: boolean
  enemyName?: string; enemyAttack?: number; enemyArmor?: number; enemyFame?: number
  isCity?: boolean
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
  enemy: {
    name: string; attack: number; armor: number; fame: number
    hp: number; maxHp: number
  }
  phase: 'PLAYER_TURN' | 'RESULT'
  round: number
  playerAttack: number; playerBlock: number
  result: 'WIN' | 'LOSE' | null
  fameGained: number; woundsTaken: number
  lootCard: CardData | null; itemDrop: ItemData | null
  roundLog: string | null
}

export interface OpponentState {
  username: string; pos: HexCoord
  fame: number; level: number; wounds: number
  handSizeMax: number; movePoints: number; movePointsMax: number
  itemCount: number
}

export interface PlayerSlot {
  playerPos: HexCoord; hand: CardData[]; discard: CardData[]
  items: ItemData[]; fame: number; level: number; wounds: number
  handSizeMax: number; movePoints: number; movePointsMax: number
  combat: CombatState | null; gameOver: boolean; levelUpMessage: string | null
}

/**
 * PvP duel state. Stored outside PlayerSlot so it survives mid-turn seat-swaps.
 *
 * Phase flow:
 *   DEFENDER_RESPONDS → challenger picks (CHALLENGER_PICKS) → defender picks (DEFENDER_PICKS) → RESOLUTION
 */
export interface PvpCombat {
  challengerSeat: 1 | 2
  phase: 'DEFENDER_RESPONDS' | 'CHALLENGER_PICKS' | 'DEFENDER_PICKS' | 'RESOLUTION'
  challengerAtk: number; challengerBlk: number
  defenderAtk: number; defenderBlk: number
  result: 'CHALLENGER_WIN' | 'DEFENDER_WIN' | 'DRAW' | null
  woundsToChallenger: number; woundsToDefender: number
  fameToChallenger: number; fameToDefender: number
}

// ── Pure helpers ──────────────────────────────────────────────────────────────

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

// ── Slot ↔ store field helpers ────────────────────────────────────────────────

type SlotFields = {
  playerPos: HexCoord; hand: CardData[]; discard: CardData[]; items: ItemData[]
  fame: number; level: number; wounds: number; handSizeMax: number
  movePoints: number; movePointsMax: number
  combat: CombatState | null; gameOver: boolean; levelUpMessage: string | null
}

function snapToSlot(s: SlotFields): PlayerSlot {
  return { playerPos: s.playerPos, hand: s.hand, discard: s.discard, items: s.items, fame: s.fame, level: s.level, wounds: s.wounds, handSizeMax: s.handSizeMax, movePoints: s.movePoints, movePointsMax: s.movePointsMax, combat: s.combat, gameOver: s.gameOver, levelUpMessage: s.levelUpMessage }
}
function slotFields(slot: PlayerSlot): SlotFields {
  return { playerPos: slot.playerPos, hand: slot.hand, discard: slot.discard, items: slot.items, fame: slot.fame, level: slot.level, wounds: slot.wounds, handSizeMax: slot.handSizeMax, movePoints: slot.movePoints, movePointsMax: slot.movePointsMax, combat: slot.combat, gameOver: slot.gameOver, levelUpMessage: slot.levelUpMessage }
}
function opponentFromSlot(slot: PlayerSlot, username: string): OpponentState {
  return { username, pos: slot.playerPos, fame: slot.fame, level: slot.level, wounds: slot.wounds, handSizeMax: slot.handSizeMax, movePoints: slot.movePoints, movePointsMax: slot.movePointsMax, itemCount: slot.items.length }
}

// ── Enemy tiers ───────────────────────────────────────────────────────────────

const ENEMY_TIERS = [
  [],
  [{ name: 'Goblin Scout', attack: 1, armor: 1, fame: 1 }, { name: 'Wolf', attack: 2, armor: 1, fame: 2 }, { name: 'Orc Grunt', attack: 2, armor: 2, fame: 2 }],
  [{ name: 'Orc Warrior', attack: 3, armor: 3, fame: 3 }, { name: 'Wolf Rider', attack: 4, armor: 2, fame: 3 }, { name: 'Orc Shaman', attack: 2, armor: 3, fame: 3 }, { name: 'Plague Rat', attack: 3, armor: 2, fame: 2 }],
  [{ name: 'Guardian Golem', attack: 3, armor: 5, fame: 5 }, { name: 'Ice Witch', attack: 4, armor: 3, fame: 5 }, { name: 'Troll Warrior', attack: 5, armor: 4, fame: 6 }, { name: 'Siege Golem', attack: 4, armor: 6, fame: 6 }],
  [{ name: 'Dragon Whelp', attack: 5, armor: 6, fame: 8 }, { name: 'Dark Mage', attack: 4, armor: 5, fame: 7 }, { name: 'Necromancer', attack: 6, armor: 5, fame: 9 }, { name: 'Wyvern', attack: 6, armor: 6, fame: 9 }],
  [{ name: 'Ancient Dragon', attack: 7, armor: 8, fame: 12 }, { name: 'Shadow Lord', attack: 8, armor: 6, fame: 11 }, { name: 'Lich King', attack: 6, armor: 9, fame: 13 }, { name: 'Void Titan', attack: 8, armor: 8, fame: 14 }],
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
  const t = rnd(ENEMY_TIERS[Math.min(ring, 5)] as { name: string; attack: number; armor: number; fame: number }[])
  return { hasEnemy: true, enemyName: t.name, enemyAttack: t.attack, enemyArmor: t.armor, enemyFame: t.fame }
}
function generateMap(): TileData[] {
  const tiles: TileData[] = []; let idx = 0; const origin = { q: 0, r: 0 }
  // Place exactly 3 cities in rings 2-4 at spread-out positions
  const cityPositions = [{ q:2,r:-1 }, { q:-2,r:2 }, { q:0,r:3 }]
  const citySet = new Set(cityPositions.map(p => `${p.q},${p.r}`))
  for (let q = -5; q <= 5; q++) for (let r = -5; r <= 5; r++) {
    const coord = { q, r }; const dist = hexDist(origin, coord)
    if (dist > 5) continue
    const ring = Math.round(dist)
    const isCity = citySet.has(`${q},${r}`)
    const terrain: TerrainType = isCity ? 'CITY' : ring === 0 ? 'PLAINS' : rnd(TERRAIN_POOLS[ring])
    const hasEnemy = !isCity && ring > 0 && terrain !== 'LAKE' && Math.random() < 0.18 + ring * 0.07
    tiles.push({ id: `t${idx++}`, coord, terrain, revealed: ring === 0, hasEnemy, isCity, ...(hasEnemy ? makeEnemyTile(ring) : {}) })
  }
  return tiles
}

// ── Items ─────────────────────────────────────────────────────────────────────

const ITEM_DEFS: Record<string, Omit<ItemData,'id'>> = {
  health_potion:   { defId:'health_potion',   name:'Health Potion',   desc:'Restore 1 wound.',         useIn:'any',       effect:'heal',     value:1, rarity:'common'   },
  war_elixir:      { defId:'war_elixir',      name:'War Elixir',      desc:'+3 Attack this combat.',   useIn:'combat',    effect:'atk_flat', value:3, rarity:'common'   },
  iron_tonic:      { defId:'iron_tonic',      name:'Iron Tonic',      desc:'+3 Block this combat.',    useIn:'combat',    effect:'blk_flat', value:3, rarity:'common'   },
  swift_boots:     { defId:'swift_boots',     name:'Swift Boots',     desc:'+3 Move points.',          useIn:'overworld', effect:'move',     value:3, rarity:'common'   },
  mana_crystal:    { defId:'mana_crystal',    name:'Mana Crystal',    desc:'+2 Attack & +2 Block.',    useIn:'combat',    effect:'atk_blk',  value:2, rarity:'uncommon' },
  rage_stone:      { defId:'rage_stone',      name:'Rage Stone',      desc:'Double your Attack.',      useIn:'combat',    effect:'atk_mult', value:2, rarity:'uncommon' },
  smoke_bomb:      { defId:'smoke_bomb',      name:'Smoke Bomb',      desc:'Negate all enemy damage.', useIn:'combat',    effect:'blk_max',  value:0, rarity:'uncommon' },
  dragon_blood:    { defId:'dragon_blood',    name:'Dragon Blood',    desc:'+6 Attack this combat.',   useIn:'combat',    effect:'atk_flat', value:6, rarity:'rare'     },
  arcane_mirror:   { defId:'arcane_mirror',   name:'Arcane Mirror',   desc:'+5 Block this combat.',    useIn:'combat',    effect:'blk_flat', value:5, rarity:'rare'     },
  elixir_of_power: { defId:'elixir_of_power', name:'Elixir of Power', desc:'+4 Attack & +4 Block.',    useIn:'combat',    effect:'atk_blk',  value:4, rarity:'rare'     },
}
const ITEM_POOL = { common:['health_potion','war_elixir','iron_tonic','swift_boots'] as const, uncommon:['mana_crystal','rage_stone','smoke_bomb'] as const, rare:['dragon_blood','arcane_mirror','elixir_of_power'] as const }
function makeItem(d: string): ItemData { return { ...ITEM_DEFS[d], id: uid() } }
function explorationDrop(ring: number): ItemData | null {
  if (Math.random() > 0.22) return null   // ~22% chance to find something while exploring
  const r = Math.random()
  if (ring <= 1)              return makeItem(rnd([...ITEM_POOL.common]))
  if (ring <= 2 || r < 0.6)  return makeItem(rnd([...ITEM_POOL.common]))
  if (ring <= 4 || r < 0.85) return makeItem(rnd([...ITEM_POOL.uncommon]))
  return makeItem(rnd([...ITEM_POOL.rare]))
}
function enemyDrop(ring: number): ItemData | null {
  if (Math.random() > 0.40 + ring * 0.06) return null  // 40-70% drop on kill
  const r = Math.random()
  if (ring <= 2)              return makeItem(rnd([...ITEM_POOL.common]))
  if (ring <= 3 || r < 0.55) return makeItem(rnd([...ITEM_POOL.common,...ITEM_POOL.uncommon]))
  if (ring <= 4 || r < 0.8)  return makeItem(rnd([...ITEM_POOL.uncommon]))
  return makeItem(rnd([...ITEM_POOL.rare]))
}
function enemyMaxHp(armor: number, fame: number): number {
  // Small enemies die in 1-2 rounds, big enemies take 3-5 rounds
  return Math.max(1, Math.ceil(fame / 3) + Math.ceil(armor / 6))
}

// ── Cards ─────────────────────────────────────────────────────────────────────

const BASE_DECK: Omit<CardData,'instanceId'>[] = [
  { defId:'rage',           name:'Rage',           attack:2, block:0, move:0, rarity:'common' },
  { defId:'rage',           name:'Rage',           attack:2, block:0, move:0, rarity:'common' },
  { defId:'determination',  name:'Determination',  attack:0, block:2, move:0, rarity:'common' },
  { defId:'determination',  name:'Determination',  attack:0, block:2, move:0, rarity:'common' },
  { defId:'concentration',  name:'Concentration',  attack:1, block:1, move:0, rarity:'common' },
  { defId:'concentration',  name:'Concentration',  attack:1, block:1, move:0, rarity:'common' },
  { defId:'battle_cry',     name:'Battle Cry',     attack:2, block:0, move:0, rarity:'common' },
  { defId:'shield_wall',    name:'Shield Wall',    attack:0, block:2, move:0, rarity:'common' },
  { defId:'improvisation',  name:'Improvisation',  attack:2, block:1, move:0, rarity:'common' },
  { defId:'cold_toughness', name:'Cold Toughness', attack:0, block:2, move:0, rarity:'common' },
]
export const LOOT_POOL: Omit<CardData,'instanceId'>[] = [
  { defId:'threatening_aura',   name:'Threatening Aura',   attack:3, block:0, move:0, rarity:'uncommon' },
  { defId:'battle_versatility', name:'Battle Versatility',  attack:2, block:2, move:0, rarity:'uncommon' },
  { defId:'iron_will',          name:'Iron Will',           attack:0, block:4, move:0, rarity:'uncommon' },
  { defId:'parry',              name:'Parry',               attack:1, block:2, move:0, rarity:'uncommon' },
  { defId:'savage_strike',      name:'Savage Strike',       attack:4, block:0, move:0, rarity:'uncommon' },
  { defId:'bladestorm',         name:'Bladestorm',          attack:2, block:1, move:0, rarity:'uncommon' },
  { defId:'war_cry',            name:'War Cry',             attack:3, block:1, move:0, rarity:'uncommon' },
  { defId:'shield_bash',        name:'Shield Bash',         attack:1, block:3, move:0, rarity:'uncommon' },
  { defId:'promise',            name:'Promise',             attack:0, block:3, move:0, rarity:'uncommon' },
  { defId:'tranquility',        name:'Tranquility',         attack:0, block:0, move:0, rarity:'rare', special:'heal1' },
  { defId:'heroic_tale',        name:'Heroic Tale',         attack:2, block:2, move:0, rarity:'rare' },
  { defId:'blood_rage',         name:'Blood Rage',          attack:5, block:0, move:0, rarity:'rare' },
  { defId:'arcane_shield',      name:'Arcane Shield',       attack:0, block:5, move:0, rarity:'rare' },
  { defId:'lightning_bolt',     name:'Lightning Bolt',      attack:5, block:0, move:0, rarity:'rare' },
  { defId:'nova_blast',         name:'Nova Blast',          attack:6, block:0, move:0, rarity:'rare' },
]
function buildStartingState() {
  const deck = shuffle(BASE_DECK.map(c => ({ ...c, instanceId: uid() })))
  return { hand: deck.slice(0, 5), discard: deck.slice(5), tiles: generateMap() }
}
const HEX_DIRS: HexCoord[] = [{ q:1,r:0 },{ q:-1,r:0 },{ q:0,r:1 },{ q:0,r:-1 },{ q:1,r:-1 },{ q:-1,r:1 }]
function isNeighbor(a: HexCoord, b: HexCoord) { return HEX_DIRS.some(d => a.q+d.q===b.q && a.r+d.r===b.r) }

// ── Store interface ───────────────────────────────────────────────────────────

const BASE_MOVE = 4

interface GameStore {
  sessionId: string | null; playerPos: HexCoord; tiles: TileData[]
  hand: CardData[]; discard: CardData[]; items: ItemData[]
  fame: number; level: number; wounds: number; handSizeMax: number
  movePoints: number; movePointsMax: number
  combat: CombatState | null; gameOver: boolean; levelUpMessage: string | null
  turnCount: number; log: string[]
  mode: 'solo' | 'local'
  localSubMode: 'coop' | 'pvp'
  activeSeat: 1 | 2; savedState: PlayerSlot | null
  pendingHandoff: boolean; localSeatNames: [string, string]
  opponent: OpponentState | null
  pvpCombat: PvpCombat | null
  challengeCooldown: number

  setSession: (id: string) => void
  movePlayer: (coord: HexCoord) => void
  playCardInCombat: (instanceId: string) => void
  useItem: (id: string) => void
  resolveCombat: () => void; dismissCombat: () => void
  endTurn: () => void; restartGame: () => void; addLog: (msg: string) => void
  initLocalCoop: (name1: string, name2: string) => void
  confirmHandoff: () => void
  initLocalPvp: (name1: string, name2: string) => void
  issueChallenge: () => void
  respondToChallenge: (accept: boolean) => void
  playCardInPvp: (instanceId: string) => void
  lockInPvp: () => void
  dismissPvp: () => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => {
  const init = buildStartingState()

  /** Mid-turn seat swap — no reshuffle, saves current state, loads other player. */
  function swapSeats(extra: Partial<GameStore> = {}) {
    const s = get()
    const currentSlot = snapToSlot(s)
    const other = s.savedState!
    const nextSeat = (s.activeSeat === 1 ? 2 : 1) as 1 | 2
    set({
      ...slotFields(other),
      savedState: currentSlot,
      activeSeat: nextSeat,
      opponent: opponentFromSlot(currentSlot, s.localSeatNames[s.activeSeat - 1]),
      ...extra,
    } as any)
  }

  function initLocal(sub: 'coop' | 'pvp', name1: string, name2: string) {
    const i1 = buildStartingState(); const i2 = buildStartingState()
    const p2Start: HexCoord = sub === 'pvp' ? { q: -1, r: 1 } : { q: 1, r: -1 }
    set({
      ...slotFields({ playerPos: { q:0,r:0 }, hand:i1.hand, discard:i1.discard, items:[], fame:0, level:1, wounds:0, handSizeMax:5, movePoints:BASE_MOVE, movePointsMax:BASE_MOVE, combat:null, gameOver:false, levelUpMessage:null }),
      tiles: i1.tiles, turnCount: 0,
      mode: 'local', localSubMode: sub,
      activeSeat: 1, pendingHandoff: false, localSeatNames: [name1, name2],
      pvpCombat: null, challengeCooldown: sub === 'pvp' ? 3 : 0,
      savedState: { playerPos:p2Start, hand:i2.hand, discard:i2.discard, items:[], fame:0, level:1, wounds:0, handSizeMax:5, movePoints:BASE_MOVE, movePointsMax:BASE_MOVE, combat:null, gameOver:false, levelUpMessage:null },
      opponent: { username:name2, pos:p2Start, fame:0, level:1, wounds:0, handSizeMax:5, movePoints:BASE_MOVE, movePointsMax:BASE_MOVE, itemCount:0 },
      log: sub === 'pvp'
        ? [`⚔ ${name1} vs ${name2} — earn cards, grow stronger, then duel! First challenge available after 3 turns.`]
        : [`${name1} & ${name2} begin co-op! ${name1} goes first.`],
    })
  }

  return {
    sessionId: null, playerPos: { q:0, r:0 },
    tiles: init.tiles, hand: init.hand, discard: init.discard, items: [],
    fame: 0, level: 1, wounds: 0, handSizeMax: 5,
    movePoints: BASE_MOVE, movePointsMax: BASE_MOVE,
    combat: null, gameOver: false, levelUpMessage: null,
    turnCount: 0, log: ['The quest begins. Explore the world!'],
    mode: 'solo', localSubMode: 'coop',
    activeSeat: 1, savedState: null, pendingHandoff: false,
    localSeatNames: ['Player 1', 'Player 2'], opponent: null,
    pvpCombat: null, challengeCooldown: 0,

    setSession: (id) => set({ sessionId: id }),
    addLog: (msg) => set(s => ({ log: [msg, ...s.log].slice(0, 30) })),

    initLocalCoop: (n1, n2) => initLocal('coop', n1, n2),
    initLocalPvp:  (n1, n2) => initLocal('pvp',  n1, n2),

    confirmHandoff: () => {
      set({ pendingHandoff: false })
      const s = get()
      if (!s.pvpCombat) get().addLog(`${s.localSeatNames[s.activeSeat - 1]}'s turn!`)
    },

    // ── PvP challenge system ──────────────────────────────────────────────────

    issueChallenge: () => {
      const s = get()
      if (s.pvpCombat || s.combat || s.mode !== 'local' || s.localSubMode !== 'pvp') return
      if (s.challengeCooldown > 0) { get().addLog(`⏳ Duel cooldown: ${s.challengeCooldown} turn(s) remaining`); return }
      set({ pvpCombat: { challengerSeat: s.activeSeat, phase: 'DEFENDER_RESPONDS', challengerAtk:0, challengerBlk:0, defenderAtk:0, defenderBlk:0, result:null, woundsToChallenger:0, woundsToDefender:0, fameToChallenger:0, fameToDefender:0 } })
      get().addLog(`⚔ ${s.localSeatNames[s.activeSeat - 1]} issues a duel challenge!`)
      swapSeats({ pendingHandoff: true })  // pass to defender to respond
    },

    respondToChallenge: (accept) => {
      const s = get()
      if (!s.pvpCombat || s.pvpCombat.phase !== 'DEFENDER_RESPONDS') return
      if (!accept) {
        // Decline penalty: declining a weaker challenger costs more fame (cowardice)
        const defLvl = s.level
        const chalLvl = s.savedState?.level ?? 1
        const gap = chalLvl - defLvl   // positive = challenger is stronger
        let penalty = gap >= 2 ? 0 : gap >= 0 ? 2 : 3 + (-gap) * 2
        const newFame = Math.max(0, s.fame - penalty)
        const penStr = penalty === 0 ? '(no penalty — wise retreat)' : `-${penalty} fame (cowardice!)`
        set({ fame: newFame, level: levelForFame(newFame), pvpCombat: null })
        get().addLog(`🏃 ${s.localSeatNames[s.activeSeat - 1]} declines ${penStr}`)
        swapSeats({ pendingHandoff: true })
        return
      }
      // Accepted — swap back to challenger so they pick cards
      set(cur => ({ pvpCombat: cur.pvpCombat ? { ...cur.pvpCombat, phase: 'CHALLENGER_PICKS' } : null }))
      const defName = s.localSeatNames[s.activeSeat - 1]
      get().addLog(`✅ ${defName} accepts! Challenger picks cards first.`)
      swapSeats({ pendingHandoff: true })
    },

    playCardInPvp: (instanceId) => {
      const s = get()
      if (!s.pvpCombat) return
      const { phase, challengerSeat } = s.pvpCombat
      if (phase !== 'CHALLENGER_PICKS' && phase !== 'DEFENDER_PICKS') return
      const card = s.hand.find(c => c.instanceId === instanceId)
      if (!card) return
      const isChal = challengerSeat === s.activeSeat
      set(cur => ({
        hand: cur.hand.filter(c => c.instanceId !== instanceId),
        discard: [...cur.discard, card],
        pvpCombat: cur.pvpCombat ? {
          ...cur.pvpCombat,
          challengerAtk: isChal ? cur.pvpCombat.challengerAtk + card.attack : cur.pvpCombat.challengerAtk,
          challengerBlk: isChal ? cur.pvpCombat.challengerBlk + card.block  : cur.pvpCombat.challengerBlk,
          defenderAtk:  !isChal ? cur.pvpCombat.defenderAtk  + card.attack  : cur.pvpCombat.defenderAtk,
          defenderBlk:  !isChal ? cur.pvpCombat.defenderBlk  + card.block   : cur.pvpCombat.defenderBlk,
        } : null,
      }))
    },

    lockInPvp: () => {
      const s = get()
      if (!s.pvpCombat) return

      if (s.pvpCombat.phase === 'CHALLENGER_PICKS') {
        // Swap to defender so they pick cards
        set(cur => ({ pvpCombat: cur.pvpCombat ? { ...cur.pvpCombat, phase: 'DEFENDER_PICKS' } : null }))
        swapSeats({ pendingHandoff: true })
        return
      }

      if (s.pvpCombat.phase === 'DEFENDER_PICKS') {
        const { challengerSeat, challengerAtk, challengerBlk, defenderAtk, defenderBlk } = s.pvpCombat
        // Currently on DEFENDER's state; savedState = CHALLENGER's state
        const defWounds  = s.wounds;           const defHSMax   = s.handSizeMax
        const chalWounds = s.savedState?.wounds ?? 0; const chalHSMax = s.savedState?.handSizeMax ?? 5
        const defLevel   = s.level;            const chalLevel  = s.savedState?.level ?? 1

        // Wound resilience: each wound = +0.5 effective block (battle desperation)
        const chalEffBlk = challengerBlk + Math.floor(chalWounds / 2)
        const defEffBlk  = defenderBlk   + Math.floor(defWounds  / 2)

        const dmgToDefender   = Math.max(0, challengerAtk - defEffBlk)
        const dmgToChallenger = Math.max(0, defenderAtk   - chalEffBlk)

        let result: PvpCombat['result']
        if (dmgToDefender > dmgToChallenger)      result = 'CHALLENGER_WIN'
        else if (dmgToChallenger > dmgToDefender) result = 'DEFENDER_WIN'
        else result = 'DRAW'

        // Winner earns loser's level as fame
        const fameToChallenger = result === 'CHALLENGER_WIN' ? defLevel  : 0
        const fameToDefender   = result === 'DEFENDER_WIN'   ? chalLevel : 0

        // Apply wounds + fame to both states
        const newDefWounds  = Math.min(defWounds  + dmgToDefender,   defHSMax  - 1)
        const newChalWounds = Math.min(chalWounds + dmgToChallenger, chalHSMax - 1)
        const newDefFame    = s.fame + fameToDefender
        const newChalFame   = (s.savedState?.fame ?? 0) + fameToChallenger

        set(cur => ({
          wounds: newDefWounds, fame: newDefFame, level: levelForFame(newDefFame),
          gameOver: newDefWounds >= defHSMax,
          savedState: cur.savedState ? { ...cur.savedState, wounds: newChalWounds, fame: newChalFame, level: levelForFame(newChalFame), gameOver: newChalWounds >= chalHSMax } : null,
          pvpCombat: cur.pvpCombat ? { ...cur.pvpCombat, phase: 'RESOLUTION', result, woundsToChallenger: dmgToChallenger, woundsToDefender: dmgToDefender, fameToChallenger, fameToDefender } : null,
        }))

        const chalName = s.localSeatNames[challengerSeat - 1]
        const defName  = s.localSeatNames[challengerSeat === 1 ? 1 : 0]
        if (result === 'CHALLENGER_WIN') get().addLog(`🏆 ${chalName} wins the duel! +${fameToChallenger} fame`)
        else if (result === 'DEFENDER_WIN') get().addLog(`🏆 ${defName} wins the duel! +${fameToDefender} fame`)
        else get().addLog('🤝 Duel — a perfect draw! No fame gained.')
      }
    },

    dismissPvp: () => {
      const s = get()
      if (!s.pvpCombat || s.pvpCombat.phase !== 'RESOLUTION') return
      const challengerSeat = s.pvpCombat.challengerSeat
      set({ pvpCombat: null, challengeCooldown: 5 })
      // Return to the challenger (who started their turn originally)
      if (s.activeSeat !== challengerSeat) swapSeats({ pendingHandoff: true })
      else set({ pendingHandoff: true })
    },

    // ── Game actions ──────────────────────────────────────────────────────────

    movePlayer: (coord) => {
      const s = get()
      if (s.combat || s.gameOver || s.pvpCombat) return
      if (!isNeighbor(s.playerPos, coord)) return
      const tile = s.tiles.find(t => t.coord.q === coord.q && t.coord.r === coord.r)
      if (!tile || tile.terrain === 'LAKE') return
      const cost = TERRAIN_MOVE_COST[tile.terrain]
      if (s.movePoints < cost) { get().addLog(`⛔ Need ${cost} moves, have ${s.movePoints}`); return }
      const isNew = !tile.revealed
      set(cur => ({
        playerPos: coord, movePoints: cur.movePoints - cost,
        tiles: cur.tiles.map(t => {
          if (t.coord.q === coord.q && t.coord.r === coord.r) return { ...t, revealed: true }
          if (isNeighbor(coord, t.coord)) return { ...t, revealed: true }
          return t
        }),
      }))
      get().addLog(`Moved to ${tile.terrain.toLowerCase()} [-${cost}]`)
      if (isNew && !tile.hasEnemy) {
        const ring = Math.round(hexDist({ q:0,r:0 }, coord))
        const drop = explorationDrop(ring)
        if (drop) { set(cur => ({ items: [...cur.items, drop] })); get().addLog(`🎁 Found ${drop.name}!`) }
      }
      if (tile.hasEnemy) {
        const atk = tile.enemyAttack ?? 2, arm = tile.enemyArmor ?? 2, fm = tile.enemyFame ?? 1
        const maxHp = enemyMaxHp(arm, fm)
        set({ combat: { enemy: { name:tile.enemyName??'Unknown', attack:atk, armor:arm, fame:fm, hp:maxHp, maxHp }, phase:'PLAYER_TURN', round:1, playerAttack:0, playerBlock:0, result:null, fameGained:0, woundsTaken:0, lootCard:null, itemDrop:null, roundLog:null } })
        get().addLog(`⚔ ${tile.enemyName} appears! (${maxHp} HP)`)
      }
      // City: heal 2 wounds + gift a common item
      if (tile.isCity) {
        const healed = Math.min(s.wounds, 2)
        const gift = makeItem(rnd([...ITEM_POOL.common]))
        set(cur => ({ wounds: Math.max(0, cur.wounds - 2), items: [...cur.items, gift] }))
        if (healed > 0) get().addLog(`🏰 City! Healed ${healed} wound(s) + received ${gift.name}`)
        else get().addLog(`🏰 City sanctuary — received ${gift.name}`)
      }
    },

    playCardInCombat: (instanceId) => {
      const s = get()
      if (!s.combat || s.combat.phase !== 'PLAYER_TURN') return
      const card = s.hand.find(c => c.instanceId === instanceId)
      if (!card) return
      const heal = card.special === 'heal1' ? 1 : 0
      set(cur => ({
        hand: cur.hand.filter(c => c.instanceId !== instanceId),
        discard: [...cur.discard, card],
        wounds: Math.max(0, cur.wounds - heal),
        combat: cur.combat ? { ...cur.combat, playerAttack: cur.combat.playerAttack + card.attack, playerBlock: cur.combat.playerBlock + card.block } : null,
      }))
      if (heal) get().addLog('💚 Tranquility — healed 1 wound!')
    },

    useItem: (id) => {
      const s = get()
      const item = s.items.find(i => i.id === id)
      if (!item) return
      const inCombat = !!s.combat && s.combat.phase === 'PLAYER_TURN'
      if (item.useIn === 'combat'    && !inCombat) return
      if (item.useIn === 'overworld' && inCombat)  return
      set(cur => ({ items: cur.items.filter(i => i.id !== id) }))
      switch (item.effect) {
        case 'heal':     set(cur => ({ wounds: Math.max(0, cur.wounds - item.value) })); get().addLog(`🧪 ${item.name} — healed ${item.value}!`); break
        case 'move':     set(cur => ({ movePoints: cur.movePoints + item.value })); get().addLog(`👟 ${item.name} — +${item.value} moves!`); break
        case 'atk_flat': if (inCombat) set(cur => ({ combat: cur.combat ? { ...cur.combat, playerAttack: cur.combat.playerAttack + item.value } : null })); get().addLog(`⚗️ ${item.name} — +${item.value} ATK!`); break
        case 'blk_flat': if (inCombat) set(cur => ({ combat: cur.combat ? { ...cur.combat, playerBlock: cur.combat.playerBlock + item.value } : null })); get().addLog(`🫙 ${item.name} — +${item.value} BLK!`); break
        case 'atk_blk':  if (inCombat) set(cur => ({ combat: cur.combat ? { ...cur.combat, playerAttack: cur.combat.playerAttack + item.value, playerBlock: cur.combat.playerBlock + item.value } : null })); get().addLog(`✨ ${item.name} — +${item.value} ATK & BLK!`); break
        case 'atk_mult': if (inCombat) set(cur => ({ combat: cur.combat ? { ...cur.combat, playerAttack: Math.round(cur.combat.playerAttack * item.value) } : null })); get().addLog(`🔴 ${item.name} — doubled!`); break
        case 'blk_max':  if (inCombat && s.combat) set(cur => ({ combat: cur.combat ? { ...cur.combat, playerBlock: s.combat!.enemy.attack } : null })); get().addLog(`💨 ${item.name} — negated!`); break
      }
    },

    resolveCombat: () => {
      const s = get()
      if (!s.combat || s.combat.phase !== 'PLAYER_TURN') return
      const { enemy, playerAttack, playerBlock, round } = s.combat

      // Co-op balance: wound resilience (each wound = +0.5 block, rounded down)
      const woundBonus = s.mode === 'local' && s.localSubMode === 'coop' ? Math.floor(s.wounds / 2) : 0
      const effectiveBlock = playerBlock + woundBonus
      if (woundBonus > 0) get().addLog(`🛡 Wound resilience: +${woundBonus} block`)

      // Damage to enemy: attack exceeding half armor lands; anything above armor fully penetrates
      const armorReduction = Math.floor(enemy.armor / 2)
      const dmgToEnemy = Math.max(0, playerAttack - armorReduction)
      const newEnemyHp = Math.max(0, enemy.hp - dmgToEnemy)

      // Damage to player: enemy hits if you don't fully block
      const roundWounds = Math.max(0, enemy.attack - effectiveBlock)
      const newWounds = s.wounds + roundWounds

      const roundNote = `Round ${round}: dealt ${dmgToEnemy} dmg (${newEnemyHp} HP left), took ${roundWounds} wound(s)`
      get().addLog(`⚔ ${roundNote}`)

      // Enemy defeated
      if (newEnemyHp === 0) {
        const lootCard = { ...rnd(LOOT_POOL), instanceId: uid() } as CardData
        const ring = Math.round(hexDist({ q:0,r:0 }, s.playerPos))
        const itemDrop = enemyDrop(ring)
        let baseFame = enemy.fame
        if (s.mode === 'local' && s.localSubMode === 'coop' && s.savedState && s.savedState.fame >= s.fame * 2) {
          baseFame += 1; get().addLog('⭐ Catch-up bonus: +1 fame!')
        }
        const newFame = s.fame + baseFame
        const newLevel = levelForFame(newFame)
        const leveledUp = newLevel > s.level
        const evenLvl = leveledUp && newLevel % 2 === 0
        const newHSMax = s.handSizeMax + (evenLvl ? 1 : 0)
        const newMoveMax = s.movePointsMax + (evenLvl ? 1 : 0)
        const gameOver = newWounds >= newHSMax
        const lvlMsg = leveledUp ? `Level ${newLevel}! ${evenLvl ? '+1 hand & +1 move' : 'Growing stronger'}` : null
        set({
          fame: newFame, level: newLevel, wounds: newWounds, handSizeMax: newHSMax,
          movePointsMax: newMoveMax, gameOver, levelUpMessage: lvlMsg,
          discard: [...s.discard, lootCard],
          items: itemDrop ? [...s.items, itemDrop] : s.items,
          combat: { ...s.combat, enemy:{ ...enemy, hp:0 }, phase:'RESULT', result:'WIN', fameGained:baseFame, woundsTaken:s.combat.woundsTaken + roundWounds, lootCard, itemDrop, roundLog:null },
        })
        get().addLog(`✅ Defeated ${enemy.name} in ${round} round(s)! +${baseFame} fame`)
        if (itemDrop)  get().addLog(`🎁 Looted: ${itemDrop.name}!`)
        if (leveledUp) get().addLog(`🌟 LEVEL UP → ${newLevel}!`)
        if (gameOver)  get().addLog('☠ Knocked out by last blow!')
        return
      }

      // Player KO'd
      const newHSMax2 = s.handSizeMax
      if (newWounds >= newHSMax2) {
        set({
          wounds: newWounds, gameOver: true,
          combat: { ...s.combat, enemy:{ ...enemy, hp:newEnemyHp }, phase:'RESULT', result:'LOSE', woundsTaken:s.combat.woundsTaken + roundWounds, roundLog:null },
        })
        get().addLog(`💀 Knocked out by ${enemy.name}!`)
        return
      }

      // Combat continues — draw 3 cards from discard into hand for next round
      const draw = Math.min(3, s.discard.length)
      const newDiscard = [...s.discard]
      const drawn = newDiscard.splice(0, draw)
      set(cur => ({
        wounds: newWounds, hand: [...cur.hand, ...drawn], discard: newDiscard,
        combat: { ...cur.combat!, enemy:{ ...enemy, hp:newEnemyHp }, round:round+1, playerAttack:0, playerBlock:0, woundsTaken:(cur.combat?.woundsTaken??0) + roundWounds, roundLog:roundNote },
      }))
      get().addLog(`🔄 Round ${round+1} begins — ${drawn.length} card(s) drawn (${newEnemyHp} HP left)`)
    },

    dismissCombat: () => {
      const s = get()
      const won = s.combat?.result === 'WIN'
      set(cur => ({
        combat: null, levelUpMessage: null,
        tiles: won ? cur.tiles.map(t => t.coord.q === cur.playerPos.q && t.coord.r === cur.playerPos.r ? { ...t, hasEnemy: false } : t) : cur.tiles,
      }))
    },

    endTurn: () => {
      const s = get()
      if (s.combat || s.gameOver || s.pvpCombat) return
      const newTurn = s.turnCount + 1
      let tiles = s.tiles
      if (newTurn % 10 === 0) {
        tiles = tiles.map(tile => {
          if (!tile.revealed || tile.hasEnemy || tile.terrain === 'LAKE') return tile
          const fromCenter = hexDist({ q:0,r:0 }, tile.coord)
          const fromPlayer = hexDist(s.playerPos, tile.coord)
          if (fromCenter < 2 || fromPlayer < 3) return tile
          if (Math.random() < 0.45) return { ...tile, ...makeEnemyTile(Math.min(Math.round(fromCenter), 5)) }
          return tile
        })
        get().addLog('⚠ Enemies have respawned!')
      }
      const all = shuffle([...s.hand, ...s.discard])
      const newHand = all.slice(0, s.handSizeMax)

      if (s.mode === 'local') {
        const currentSlot: PlayerSlot = { ...snapToSlot(s), hand: newHand, discard: all.slice(s.handSizeMax), movePoints: s.movePointsMax, combat: null, levelUpMessage: null }
        const other = s.savedState!
        const nextSeat = (s.activeSeat === 1 ? 2 : 1) as 1 | 2
        const myName = s.localSeatNames[s.activeSeat - 1]
        const otherName = s.localSeatNames[nextSeat - 1]
        set({
          ...slotFields(other), savedState: currentSlot,
          activeSeat: nextSeat, pendingHandoff: true,
          opponent: opponentFromSlot(currentSlot, myName),
          challengeCooldown: Math.max(0, s.challengeCooldown - 1),
          tiles, turnCount: newTurn,
        })
        get().addLog(`${myName} ends turn ${newTurn} → ${otherName}`)
        return
      }

      set({ hand: newHand, discard: all.slice(s.handSizeMax), tiles, turnCount: newTurn, movePoints: s.movePointsMax })
      get().addLog(`Turn ${newTurn} — ${newHand.length} cards, ${s.movePointsMax} moves`)
    },

    restartGame: () => {
      const init = buildStartingState()
      set({
        sessionId: null, playerPos: { q:0,r:0 }, tiles: init.tiles,
        hand: init.hand, discard: init.discard, items: [],
        fame: 0, level: 1, wounds: 0, handSizeMax: 5,
        movePoints: BASE_MOVE, movePointsMax: BASE_MOVE,
        combat: null, gameOver: false, levelUpMessage: null,
        turnCount: 0, log: ['New game — good luck!'],
        mode: 'solo', localSubMode: 'coop',
        activeSeat: 1, savedState: null, pendingHandoff: false,
        localSeatNames: ['Player 1', 'Player 2'], opponent: null,
        pvpCombat: null, challengeCooldown: 0,
      })
    },
  }
})
