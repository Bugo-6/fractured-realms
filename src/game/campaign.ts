import type { ChapterDef, SaveState } from './types';

const COL_REYES = 0x4ade80;
const COL_NARRATOR = 0x9ca3af;
const COL_ENEMY = 0xb91c1c;
const COL_VERA = 0x06b6d4;
const COL_AI = 0xf43f5e;

export const CAMPAIGN: ChapterDef[] = [
  {
    id: 0,
    title: 'First Contact',
    arena: 'desertTown',
    recommended: 80,
    reward: 120,
    unlocks: ['heavy', 'medic'],
    briefing: [
      { speaker: 'NARRATOR', speakerColor: COL_NARRATOR, text: '2041. The Gray Fever turned millions into Ferals. The dead walk the dust.' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'This is what is left of Redrock. Our last outpost in the western dead zone.' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'A horde is closing on the town. Hold the line, soldiers. No one gets through.' },
    ],
    victory: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'The horde broke against us. Redrock stands another day.' },
      { speaker: 'NARRATOR', speakerColor: COL_NARRATOR, text: 'Scavengers recovered heavy ordnance from the ruins. New units are available.' },
    ],
    defeat: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'Fall back! Redrock is overrun... regroup and try again.' },
    ],
    enemies: [
      { type: 'zombie', count: 8 },
      { type: 'feral', count: 3 },
    ],
  },
  {
    id: 1,
    title: 'River Crossing',
    arena: 'coastalRuins',
    recommended: 140,
    reward: 160,
    unlocks: ['biker', 'sniper'],
    briefing: [
      { speaker: 'NARRATOR', speakerColor: COL_NARRATOR, text: 'The old coast highway bridge. Beyond it, the sea swallows the ruined cities.' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'Mutant raiders have claimed this crossing. We need it to reach the mainland.' },
      { speaker: 'RAIDER', speakerColor: COL_ENEMY, text: 'Flesh-things! The bridge is OURS. Come and bleed on it.' },
    ],
    victory: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'Bridge secured. The raiders fled into the tide.' },
      { speaker: 'NARRATOR', speakerColor: COL_NARRATOR, text: 'Local militia join your cause, bringing bikes and rifles.' },
    ],
    defeat: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'They pushed us off the bridge. We bleed for nothing today.' },
    ],
    enemies: [
      { type: 'feral', count: 5 },
      { type: 'brute', count: 2 },
      { type: 'zombie', count: 4 },
    ],
  },
  {
    id: 2,
    title: 'Protocol Zero',
    arena: 'industrial',
    recommended: 220,
    reward: 220,
    unlocks: ['combatBot', 'warDrone'],
    briefing: [
      { speaker: 'VERA (AI ally)', speakerColor: COL_VERA, text: 'Commander, this is Vera. I have decrypted the factory layout. It builds the machine army.' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'A rogue military AI runs this plant. We shut it down, we slow the robots.' },
      { speaker: 'VERA (AI ally)', speakerColor: COL_VERA, text: 'Warning: automated defenders online. Killer Bots inbound.' },
    ],
    victory: [
      { speaker: 'VERA (AI ally)', speakerColor: COL_VERA, text: 'Factory core disabled. I have salvaged combat chassis schematics for you.' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'Now we build our own machines. Good work, Vera.' },
    ],
    defeat: [
      { speaker: 'VERA (AI ally)', speakerColor: COL_VERA, text: 'Defenders have repelled us. Recommend tactical withdrawal, Commander.' },
    ],
    enemies: [
      { type: 'killerBot', count: 6 },
      { type: 'robotTank', count: 1 },
    ],
  },
  {
    id: 3,
    title: 'Desert Storm',
    arena: 'desertOpen',
    recommended: 280,
    reward: 260,
    briefing: [
      { speaker: 'NARRATOR', speakerColor: COL_NARRATOR, text: 'The open dunes. No cover. No mercy. Only sun and sand.' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'It is an ambush. Mutants and machines both. Form up and fight back to back!' },
      { speaker: 'RAIDER', speakerColor: COL_ENEMY, text: 'The desert eats the weak. We will pick your bones clean.' },
    ],
    victory: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'We turned their ambush into their grave. Onward to the hive.' },
    ],
    defeat: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'The sand drinks our blood. Pull out before it is too late.' },
    ],
    enemies: [
      { type: 'feral', count: 6 },
      { type: 'brute', count: 3 },
      { type: 'killerBot', count: 3 },
    ],
  },
  {
    id: 4,
    title: 'Into the Hive',
    arena: 'underground',
    recommended: 360,
    reward: 340,
    unlocks: ['mechWalker'],
    briefing: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'The mutant fortress lies in the caverns below. Their warlord, the Alpha, waits.' },
      { speaker: 'VERA (AI ally)', speakerColor: COL_VERA, text: 'Lava vents in the cavern. Watch your footing. Bio-signatures are massive.' },
      { speaker: 'MUTANT ALPHA', speakerColor: COL_ENEMY, text: 'You crawl into MY hive, little human? I will wear your skull.' },
    ],
    victory: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'The Alpha is dead. The mutant threat is broken.' },
      { speaker: 'VERA (AI ally)', speakerColor: COL_VERA, text: 'Only one enemy remains, Commander. The Machine God itself.' },
    ],
    defeat: [
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'The hive is too deep, too many. Retreat to the surface!' },
    ],
    enemies: [
      { type: 'brute', count: 4 },
      { type: 'feral', count: 6 },
      { type: 'alpha', count: 1 },
    ],
  },
  {
    id: 5,
    title: 'Machine God',
    arena: 'crater',
    recommended: 460,
    reward: 500,
    briefing: [
      { speaker: 'VERA (AI ally)', speakerColor: COL_VERA, text: 'This crater is its core. The rogue AI calls itself OVERMIND. It controls everything.' },
      { speaker: 'OVERMIND', speakerColor: COL_AI, text: 'COMMANDER REYES. HUMANITY IS A FAILED ITERATION. I AM THE CORRECTION.' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'Then come correct us. All units, this is the last stand of the human race.' },
    ],
    victory: [
      { speaker: 'OVERMIND', speakerColor: COL_AI, text: 'IMPOSSIBLE... CORE INTEGRITY... FAIL...ING...' },
      { speaker: 'CMDR REYES', speakerColor: COL_REYES, text: 'It is over. The Machine God is silent. We won.' },
    ],
    defeat: [
      { speaker: 'OVERMIND', speakerColor: COL_AI, text: 'AS PREDICTED. HUMANITY ENDS HERE.' },
    ],
    enemies: [
      { type: 'robotTank', count: 3 },
      { type: 'killerBot', count: 6 },
      { type: 'mechWalker', count: 1, level: 3 },
    ],
  },
];

export const ENDING_LINES: string[] = [
  'The Overmind core goes dark across a thousand miles of dead wire.',
  'Its robot legions freeze where they stand, then crumple into scrap.',
  'For the first time in years, the wasteland is quiet.',
  'The survivors of Redrock rebuild. Crops break the cracked desert soil.',
  'The Ferals still wander the dark places. The mutants are not all gone.',
  'But humanity is organized again. Humanity endures.',
  'Commander Reyes lowers the rifle for the last time, and watches the sun rise.',
  '',
  'WASTELAND COMMAND',
  'Thank you for playing.',
];

const SAVE_KEY = 'wasteland_command_save_v1';

export function defaultSave(): SaveState {
  return {
    gold: 350,
    currentChapter: 0,
    completedChapters: [],
    roster: [
      { type: 'scout', count: 3, level: 1 },
      { type: 'rifleman', count: 3, level: 1 },
    ],
    unlocked: ['scout', 'rifleman'],
  };
}

export function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveState;
    if (typeof parsed.gold !== 'number' || !Array.isArray(parsed.roster)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSave(state: SaveState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode errors
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
