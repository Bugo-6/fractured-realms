export type TeamId = 0 | 1;

export type UnitClassId =
  | 'knight' | 'archer' | 'mage' | 'paladin'
  | 'roman' | 'gladiator' | 'catapult'
  | 'soldier' | 'mech' | 'drone'
  | 'survivor' | 'mutant' | 'vehicle'
  | 'orc' | 'zombie' | 'robot' | 'void_creature' | 'void_titan';

export interface UnitDef {
  id: UnitClassId;
  name: string;
  faction: string;
  hp: number;
  damage: number;
  speed: number;
  range: number;
  attackCooldown: number;
  cost: number;
  color: string;
  letter: string;
  isRanged: boolean;
  description: string;
  radius: number;
}

export interface BattleUnit {
  id: number;
  classId: UnitClassId;
  team: TeamId;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  state: 'seeking' | 'attacking' | 'dead';
  attackTimer: number;
  targetId: number | null;
  damage: number;
  speed: number;
  range: number;
  attackCooldown: number;
  color: string;
  letter: string;
  isRanged: boolean;
  radius: number;
  flashTimer: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface BattleState {
  units: BattleUnit[];
  particles: Particle[];
  tick: number;
  status: 'running' | 'victory' | 'defeat';
  teamCount: [number, number];
}

export interface ArmyComp {
  classId: UnitClassId;
  count: number;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  preStory: string;
  quoteA: string;
  quoteB: string;
  postStoryWin: string;
  postStoryLose: string;
  enemyArmy: ArmyComp[];
  reward: number;
  unlocks: UnitClassId[];
  terrain: 'hills' | 'desert' | 'industrial' | 'wasteland' | 'ruins' | 'void';
  enemyLabel: string;
}

export type Screen =
  | 'menu'
  | 'campaign'
  | 'pre-battle'
  | 'battle'
  | 'post-battle'
  | 'sandbox-setup'
  | 'sandbox-battle';

export interface GameState {
  screen: Screen;
  gold: number;
  currentChapter: number;
  completedChapters: number[];
  unlockedUnits: UnitClassId[];
  playerArmy: ArmyComp[];
  lastBattleResult: 'victory' | 'defeat' | null;
  sandboxPlayerArmy: ArmyComp[];
  sandboxEnemyArmy: ArmyComp[];
  speedMultiplier: number;
}
