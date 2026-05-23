import { Chapter, UnitClassId, ArmyComp } from './types';

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: 'The Awakening',
    subtitle: 'Chapter I',
    enemyLabel: 'Orc Horde',
    preStory:
      'The ancient realm of Aldor trembles. Orc warbands pour from the mountains, burning villages. A council of elders summons you — the Eternal Commander — from legend.',
    quoteA: '"Commander, the orcs number in the dozens. Our knights stand ready."',
    quoteB: '"Show no mercy. The realm depends on it."',
    postStoryWin:
      'The warband is broken. The villages are safe — for now. The elders speak of rifts opening across the land. Something pulls armies from other worlds through. You must grow your forces.',
    postStoryLose:
      'The knights fell. Regroup, Commander. Study the enemy composition and return stronger.',
    enemyArmy: [{ classId: 'orc', count: 22 }],
    reward: 260,
    unlocks: ['archer'] as UnitClassId[],
    terrain: 'hills',
  },
  {
    id: 2,
    title: 'Blood and Iron',
    subtitle: 'Chapter II',
    enemyLabel: 'Iron Legion',
    preStory:
      'A dimensional rift tears open to the south. Through it march the Iron Legion — Roman soldiers from another age, armed with pilum and gladius. They see your kingdom as a new conquest.',
    quoteA: '"They come in perfect formation. Disciplined. Deadly."',
    quoteB: '"But formations can be broken, Commander."',
    postStoryWin:
      'The legions are defeated. Their general kneels and offers his sword in alliance. The Iron Legion joins your cause. New fighters are available for hire.',
    postStoryLose:
      'Their formation held. Numbers and positioning matter here — study their tactics.',
    enemyArmy: [
      { classId: 'roman', count: 22 },
      { classId: 'gladiator', count: 7 },
    ],
    reward: 420,
    unlocks: ['roman', 'gladiator', 'mage'] as UnitClassId[],
    terrain: 'desert',
  },
  {
    id: 3,
    title: 'Signal Lost',
    subtitle: 'Chapter III',
    enemyLabel: 'Machine Swarm',
    preStory:
      'A temporal portal explodes open. Steel soldiers with glowing optics pour through — machines of war from a future realm. They call themselves Hunter-Killers, and they take no prisoners.',
    quoteA: '"Commander — no heartbeat, no breath. These warriors are machines."',
    quoteB: '"Then we break them like machines — with enough force."',
    postStoryWin:
      'The machine swarm is disabled. From the wreckage you recover schematics — and a War Mech that chose to defect. Technology is now yours to command.',
    postStoryLose:
      'The machines were too precise. Ranged units and heavy armor are your best bet.',
    enemyArmy: [
      { classId: 'robot', count: 22 },
      { classId: 'mech', count: 3 },
    ],
    reward: 620,
    unlocks: ['soldier', 'mech', 'drone'] as UnitClassId[],
    terrain: 'industrial',
  },
  {
    id: 4,
    title: 'Zero Hour',
    subtitle: 'Chapter IV',
    enemyLabel: 'The Undead',
    preStory:
      "The wasteland rift opens onto a world that died. From it spill the walking dead — dozens of them — driven by the Void's hunger. And alongside them, mutated survivors fighting their own demons.",
    quoteA: '"Commander, the dead outnumber us ten to one."',
    quoteB: '"They\'re slow. Use that. Cut them down before they reach your lines."',
    postStoryWin:
      'The horde is cleansed. From the ashes emerge the Last Breath — survivors hardened by apocalypse. They fight for one reason: to prevent this happening to another world.',
    postStoryLose:
      'They overwhelmed with numbers. Speed, range, and catapults are your allies here.',
    enemyArmy: [
      { classId: 'zombie', count: 55 },
      { classId: 'mutant', count: 12 },
    ],
    reward: 780,
    unlocks: ['survivor', 'mutant', 'vehicle', 'catapult'] as UnitClassId[],
    terrain: 'wasteland',
  },
  {
    id: 5,
    title: 'The Alliance',
    subtitle: 'Chapter V',
    enemyLabel: 'Coalition of Chaos',
    preStory:
      'Four realms at war with each other while the Void grows stronger. A massive battle erupts at the Nexus Point — where all rifts converge. Only by surviving the chaos can you forge unity.',
    quoteA: '"Every faction attacks every other. There is no ally here — only survival."',
    quoteB: '"Win this, and they will all follow."',
    postStoryWin:
      'You stand alone at the Nexus. The bloodshed stops. Knights, legionaries, troopers, survivors — all eyes turn to you. The alliance is forged. One enemy remains.',
    postStoryLose:
      'The chaos consumed us. Return with a stronger, more balanced force.',
    enemyArmy: [
      { classId: 'orc', count: 18 },
      { classId: 'roman', count: 14 },
      { classId: 'robot', count: 14 },
      { classId: 'zombie', count: 22 },
      { classId: 'gladiator', count: 6 },
    ],
    reward: 1200,
    unlocks: ['paladin'] as UnitClassId[],
    terrain: 'ruins',
  },
  {
    id: 6,
    title: 'The Void Gate',
    subtitle: 'Final Chapter',
    enemyLabel: 'The Void',
    preStory:
      "The Void itself tears through reality. Not just creatures — the Void in its true form, given shape and hunger. Wraiths and Titans pour from a gate that will consume all realms if left open. This is the last stand.",
    quoteA: '"Commander. If we fall here, there are no more worlds to flee to."',
    quoteB: '"Then we don\'t fall."',
    postStoryWin:
      '★ The Void Gate closes. The realms stabilize. In the silence after battle, soldiers of four ages stand together — knights and troopers, survivors and legionaries. You did it, Commander. The fractured realms are whole.',
    postStoryLose:
      'The Void is powerful beyond measure. But you are persistent. Muster everything and return.',
    enemyArmy: [
      { classId: 'void_creature', count: 28 },
      { classId: 'void_titan', count: 6 },
    ],
    reward: 0,
    unlocks: [] as UnitClassId[],
    terrain: 'void',
  },
];

export const STARTER_ARMY: ArmyComp[] = [{ classId: 'knight', count: 10 }];
export const STARTING_GOLD = 300;
export const INITIALLY_UNLOCKED: UnitClassId[] = ['knight'];

export const SANDBOX_ENEMY_PRESETS: Array<{ label: string; army: ArmyComp[] }> = [
  { label: '30 Orcs',         army: [{ classId: 'orc', count: 30 }] },
  { label: '50 Zombies',      army: [{ classId: 'zombie', count: 50 }] },
  { label: 'Roman Assault',   army: [{ classId: 'roman', count: 25 }, { classId: 'gladiator', count: 10 }] },
  { label: 'Machine Army',    army: [{ classId: 'robot', count: 25 }, { classId: 'mech', count: 5 }] },
  { label: 'Void Invasion',   army: [{ classId: 'void_creature', count: 20 }, { classId: 'void_titan', count: 3 }] },
  { label: 'Chaos (All)',     army: [
      { classId: 'orc', count: 12 }, { classId: 'zombie', count: 15 },
      { classId: 'roman', count: 10 }, { classId: 'robot', count: 10 },
    ],
  },
];
