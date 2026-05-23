// Core type definitions for WASTELAND COMMAND

export type FactionId = 'survivor' | 'militia' | 'tech' | 'enemy';

export type ArenaType =
  | 'desertTown'
  | 'coastalRuins'
  | 'industrial'
  | 'desertOpen'
  | 'underground'
  | 'crater';

// Every distinct unit kind in the game
export type UnitTypeId =
  // Survivor Corps
  | 'scout'
  | 'rifleman'
  | 'heavy'
  | 'medic'
  // Militia
  | 'biker'
  | 'bomber'
  | 'sniper'
  // Tech Division
  | 'combatBot'
  | 'warDrone'
  | 'mechWalker'
  // Enemies
  | 'zombie'
  | 'feral'
  | 'brute'
  | 'alpha'
  | 'killerBot'
  | 'robotTank';

export type AttackKind = 'ranged' | 'melee' | 'heal' | 'explosive';

export interface UnitDef {
  id: UnitTypeId;
  name: string;
  faction: FactionId;
  color: number; // hex color for three.js
  hp: number;
  dmg: number;
  spd: number; // movement units per "second"
  range: number; // attack range in world units * scale
  cost: number; // gold cost (0 = not buyable / enemy only)
  attackKind: AttackKind;
  attackCooldown: number; // seconds between attacks
  flying?: boolean; // floats above ground
  scale?: number; // model scale multiplier
  description: string;
}

// A unit instance the player owns (persisted in save)
export interface OwnedUnit {
  type: UnitTypeId;
}

// A purchasable/upgradable unit type entry in the roster
export interface RosterEntry {
  type: UnitTypeId;
  count: number; // how many the player owns
  level: number; // 1..3
}

export interface ChapterDef {
  id: number;
  title: string;
  arena: ArenaType;
  briefing: DialogueLine[];
  victory: DialogueLine[];
  defeat: DialogueLine[];
  enemies: EnemySpawn[];
  reward: number;
  unlocks?: UnitTypeId[]; // unit types unlocked on victory
  recommended: number; // recommended army gold value
}

export interface EnemySpawn {
  type: UnitTypeId;
  count: number;
  level?: number;
}

export interface DialogueLine {
  speaker: string;
  speakerColor: number;
  text: string;
}

// Persistent save state
export interface SaveState {
  gold: number;
  currentChapter: number; // index of next chapter to play
  completedChapters: number[];
  roster: RosterEntry[]; // owned units + their levels
  unlocked: UnitTypeId[]; // unit types player can buy
}

// ---- Battle simulation ----

export interface BattleUnit {
  id: number;
  type: UnitTypeId;
  team: 'player' | 'enemy';
  level: number;
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  dmg: number;
  spd: number;
  range: number;
  attackKind: AttackKind;
  attackCooldown: number;
  cooldownTimer: number;
  facing: number; // radians, rotation around Y
  alive: boolean;
  dying: boolean;
  deathTimer: number; // counts up after death for fall animation
  spawnTimer: number; // counts up from 0 for spawn animation
  targetId: number | null;
  flying: boolean;
  scale: number;
  // transient effects
  hitFlash: number; // > 0 means recently hit
  attackAnim: number; // > 0 means recently attacked (lunge / muzzle flash)
}

export interface Projectile {
  id: number;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  team: 'player' | 'enemy';
  kind: AttackKind;
  life: number;
  color: number;
}

export interface BattleConfig {
  arena: ArenaType;
  playerArmy: { type: UnitTypeId; level: number }[];
  enemyArmy: { type: UnitTypeId; level: number }[];
}

export interface BattleState {
  units: BattleUnit[];
  projectiles: Projectile[];
  playerAlive: number;
  enemyAlive: number;
  finished: boolean;
  winner: 'player' | 'enemy' | null;
  elapsed: number;
}
