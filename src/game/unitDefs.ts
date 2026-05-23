import { UnitClassId, UnitDef } from './types';

export const UNIT_DEFS: Record<UnitClassId, UnitDef> = {
  // ── FANTASY ──────────────────────────────────────────────────────────────
  knight: {
    id: 'knight', name: 'Knight', faction: 'Kingdom of Aldor',
    hp: 120, damage: 15, speed: 1.4, range: 36, attackCooldown: 800,
    cost: 20, color: '#60a5fa', letter: 'K', isRanged: false, radius: 10,
    description: 'Armored warrior. Tough and reliable.',
  },
  archer: {
    id: 'archer', name: 'Archer', faction: 'Kingdom of Aldor',
    hp: 60, damage: 22, speed: 1.3, range: 190, attackCooldown: 1200,
    cost: 18, color: '#4ade80', letter: 'A', isRanged: true, radius: 8,
    description: 'Swift ranged attacker. Deadly at distance.',
  },
  mage: {
    id: 'mage', name: 'Arcane Mage', faction: 'Kingdom of Aldor',
    hp: 50, damage: 58, speed: 1.0, range: 230, attackCooldown: 2100,
    cost: 42, color: '#a78bfa', letter: 'M', isRanged: true, radius: 8,
    description: 'High damage spellcaster. Glass cannon.',
  },
  paladin: {
    id: 'paladin', name: 'Paladin', faction: 'Kingdom of Aldor',
    hp: 240, damage: 22, speed: 1.1, range: 36, attackCooldown: 1000,
    cost: 58, color: '#fbbf24', letter: 'P', isRanged: false, radius: 12,
    description: 'Holy champion. Immense health pool.',
  },

  // ── HISTORICAL ───────────────────────────────────────────────────────────
  roman: {
    id: 'roman', name: 'Legionary', faction: 'Iron Legion',
    hp: 90, damage: 12, speed: 1.3, range: 33, attackCooldown: 700,
    cost: 18, color: '#f97316', letter: 'R', isRanged: false, radius: 9,
    description: 'Disciplined soldier. Strength in numbers.',
  },
  gladiator: {
    id: 'gladiator', name: 'Gladiator', faction: 'Iron Legion',
    hp: 130, damage: 28, speed: 1.9, range: 36, attackCooldown: 900,
    cost: 35, color: '#ef4444', letter: 'G', isRanged: false, radius: 10,
    description: 'Arena champion. Fast and fierce.',
  },
  catapult: {
    id: 'catapult', name: 'Catapult', faction: 'Iron Legion',
    hp: 70, damage: 130, speed: 0.4, range: 460, attackCooldown: 3200,
    cost: 80, color: '#78716c', letter: 'C', isRanged: true, radius: 13,
    description: 'Siege weapon. Devastating range, very slow reload.',
  },

  // ── SCI-FI ───────────────────────────────────────────────────────────────
  soldier: {
    id: 'soldier', name: 'Assault Trooper', faction: 'Void Reapers',
    hp: 80, damage: 20, speed: 1.5, range: 150, attackCooldown: 600,
    cost: 25, color: '#06b6d4', letter: 'S', isRanged: true, radius: 9,
    description: 'Reliable infantry with rifles.',
  },
  mech: {
    id: 'mech', name: 'War Mech', faction: 'Void Reapers',
    hp: 360, damage: 38, speed: 0.9, range: 130, attackCooldown: 850,
    cost: 95, color: '#0891b2', letter: 'X', isRanged: true, radius: 14,
    description: 'Armored combat mech. Slow but devastating.',
  },
  drone: {
    id: 'drone', name: 'Attack Drone', faction: 'Void Reapers',
    hp: 35, damage: 28, speed: 2.9, range: 165, attackCooldown: 700,
    cost: 38, color: '#22d3ee', letter: 'D', isRanged: true, radius: 7,
    description: 'Ultra-fast aerial unit. Fragile but swift.',
  },

  // ── APOCALYPTIC ──────────────────────────────────────────────────────────
  survivor: {
    id: 'survivor', name: 'Survivor', faction: 'Last Breath',
    hp: 70, damage: 14, speed: 1.5, range: 140, attackCooldown: 900,
    cost: 12, color: '#84cc16', letter: 'V', isRanged: true, radius: 8,
    description: 'Battle-hardened survivor. Cheap and effective.',
  },
  mutant: {
    id: 'mutant', name: 'Mutant Brute', faction: 'Last Breath',
    hp: 185, damage: 22, speed: 1.3, range: 33, attackCooldown: 1100,
    cost: 20, color: '#65a30d', letter: 'U', isRanged: false, radius: 11,
    description: 'Mutated brawler. Strong and resilient.',
  },
  vehicle: {
    id: 'vehicle', name: 'Armored Vehicle', faction: 'Last Breath',
    hp: 480, damage: 48, speed: 1.0, range: 160, attackCooldown: 1300,
    cost: 115, color: '#4d7c0f', letter: 'T', isRanged: true, radius: 15,
    description: 'Mobile fortress. Immense durability.',
  },

  // ── ENEMY-ONLY ───────────────────────────────────────────────────────────
  orc: {
    id: 'orc', name: 'Orc Warrior', faction: 'Orc Horde',
    hp: 80, damage: 13, speed: 1.5, range: 33, attackCooldown: 850,
    cost: 0, color: '#16a34a', letter: 'O', isRanged: false, radius: 10,
    description: '',
  },
  zombie: {
    id: 'zombie', name: 'Zombie', faction: 'Undead',
    hp: 60, damage: 8, speed: 0.7, range: 28, attackCooldown: 1500,
    cost: 0, color: '#6b7280', letter: 'Z', isRanged: false, radius: 9,
    description: '',
  },
  robot: {
    id: 'robot', name: 'Hunter-Killer', faction: 'Machine Swarm',
    hp: 100, damage: 18, speed: 1.3, range: 110, attackCooldown: 700,
    cost: 0, color: '#475569', letter: 'B', isRanged: true, radius: 9,
    description: '',
  },
  void_creature: {
    id: 'void_creature', name: 'Void Wraith', faction: 'The Void',
    hp: 160, damage: 26, speed: 1.7, range: 42, attackCooldown: 600,
    cost: 0, color: '#7c3aed', letter: 'W', isRanged: false, radius: 10,
    description: '',
  },
  void_titan: {
    id: 'void_titan', name: 'Void Titan', faction: 'The Void',
    hp: 900, damage: 65, speed: 0.8, range: 65, attackCooldown: 1000,
    cost: 0, color: '#4c1d95', letter: '!', isRanged: false, radius: 18,
    description: '',
  },
};

export const PLAYABLE_UNITS: UnitClassId[] = [
  'knight', 'archer', 'mage', 'paladin',
  'roman', 'gladiator', 'catapult',
  'soldier', 'mech', 'drone',
  'survivor', 'mutant', 'vehicle',
];

export const FACTION_COLORS: Record<string, string> = {
  'Kingdom of Aldor': '#60a5fa',
  'Iron Legion':      '#f97316',
  'Void Reapers':     '#06b6d4',
  'Last Breath':      '#84cc16',
};
