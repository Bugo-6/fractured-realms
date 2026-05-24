import type { ArenaType, ChapterDef, EnemySpawn, SaveState, UnitTypeId } from './types';

const COL_REYES = 0x4ade80;
const COL_NARRATOR = 0x9ca3af;
const COL_ENEMY = 0xb91c1c;
const COL_VERA = 0x06b6d4;
const COL_AI = 0xf43f5e;

// ---- Zone definitions: 6 zones x 5 chapters = 30 chapters. ----

interface ZoneDef {
  arena: ArenaType;
  baseCount: number; // base total enemy count for chapter 1 of the zone
  titles: [string, string, string, string, string];
  // returns the enemy composition for chapter `i` (0..4) within the zone,
  // given a target total enemy count.
  composition: (total: number, levelBoost: number) => EnemySpawn[];
  // dialogue speaker/line generators per chapter index within the zone
  intro: string; // a short scene-setting line for the zone
  blurb: (i: number) => string; // story blurb per chapter
}

// Helper to split a total count across types by weights.
function splitCount(total: number, parts: { type: UnitTypeId; weight: number; level?: number }[]): EnemySpawn[] {
  const totalWeight = parts.reduce((a, p) => a + p.weight, 0);
  const out: EnemySpawn[] = [];
  let assigned = 0;
  parts.forEach((p, idx) => {
    let c =
      idx === parts.length - 1
        ? total - assigned
        : Math.max(1, Math.round((total * p.weight) / totalWeight));
    if (c < 0) c = 0;
    assigned += c;
    if (c > 0) out.push({ type: p.type, count: c, level: p.level });
  });
  return out;
}

const ZONES: ZoneDef[] = [
  // Zone 1: desertTown vs zombies and ferals
  {
    arena: 'desertTown',
    baseCount: 15,
    titles: ['First Blood', 'Survivors', 'The Swarm', 'Breaking Point', 'Last Stand'],
    intro: 'The dead walk the dust of Redrock. Hold the line.',
    blurb: (i) =>
      [
        'The first horde reaches the outpost walls. Hold them at the gate.',
        'More survivors stream in, and the dead follow close behind.',
        'A swarm of Ferals pours out of the dunes. There is no time to think.',
        'The line is buckling. Every soldier matters now.',
        'The largest horde yet. Hold Redrock, or lose it forever.',
      ][i],
    composition: (total, lvl) =>
      splitCount(total, [
        { type: 'zombie', weight: 3, level: lvl >= 2 ? 2 : 1 },
        { type: 'feral', weight: 2, level: lvl >= 2 ? 2 : 1 },
      ]),
  },
  // Zone 2: coastalRuins vs mutants and brutes
  {
    arena: 'coastalRuins',
    baseCount: 20,
    titles: ['Shore of Bones', 'Tide of Flesh', 'The Bridge', 'Mutant Rising', 'Coastal Siege'],
    intro: 'The drowned cities crawl with mutant raiders.',
    blurb: (i) =>
      [
        'Mutant raiders have claimed the coast. Take back the shore.',
        'A tide of mutant flesh surges from the ruins.',
        'The old highway bridge is the only way through. Seize it.',
        'The mutants are evolving. Brutes lead the charge now.',
        'The raiders throw everything at you in one final siege.',
      ][i],
    composition: (total, lvl) =>
      splitCount(total, [
        { type: 'feral', weight: 3, level: lvl >= 2 ? 2 : 1 },
        { type: 'zombie', weight: 2, level: lvl >= 2 ? 2 : 1 },
        { type: 'brute', weight: 2, level: lvl >= 3 ? 2 : 1 },
      ]),
  },
  // Zone 3: industrial vs killerBots and robotTanks
  {
    arena: 'industrial',
    baseCount: 18,
    titles: ['Steel Rain', 'Factory Floor', 'Protocol Omega', 'Machine Heart', 'Cold Iron'],
    intro: 'The rogue factory builds an endless machine army.',
    blurb: (i) =>
      [
        'Killer Bots patrol the factory perimeter. Breach it.',
        'The factory floor is a maze of steel and gunfire.',
        'Protocol Omega activates the heavy units. Robot Tanks roll out.',
        'Strike at the machine heart before it floods the line.',
        'The factory core is sealed behind a wall of cold iron.',
      ][i],
    composition: (total, lvl) =>
      splitCount(total, [
        { type: 'killerBot', weight: 4, level: lvl >= 2 ? 2 : 1 },
        { type: 'robotTank', weight: 1, level: lvl >= 3 ? 2 : 1 },
      ]),
  },
  // Zone 4: desertOpen mixed enemies all types
  {
    arena: 'desertOpen',
    baseCount: 25,
    titles: ['Desert Storm', 'Sand & Blood', "No Man's Land", 'Crossroads', 'The Gauntlet'],
    intro: 'Open dunes. No cover. Mutants and machines both.',
    blurb: (i) =>
      [
        'An ambush in the open dunes. Fight back to back.',
        'Sand and blood mix as the horde closes from all sides.',
        "No man's land stretches in every direction. Survive it.",
        'The crossroads of the wasteland. Everything wants you dead.',
        'The gauntlet: every enemy type, all at once.',
      ][i],
    composition: (total, lvl) =>
      splitCount(total, [
        { type: 'feral', weight: 3, level: lvl >= 2 ? 2 : 1 },
        { type: 'zombie', weight: 2, level: lvl >= 2 ? 2 : 1 },
        { type: 'brute', weight: 2, level: lvl >= 3 ? 2 : 1 },
        { type: 'killerBot', weight: 2, level: lvl >= 3 ? 2 : 1 },
      ]),
  },
  // Zone 5: underground brutes, alphas, heavy mixed
  {
    arena: 'underground',
    baseCount: 22,
    titles: ['Into Darkness', 'Cave Dwellers', 'The Deep', 'Lava Fields', 'Hive Queen'],
    intro: 'The mutant hive sprawls in the caverns below.',
    blurb: (i) =>
      [
        'Descend into the darkness of the hive. Brutes guard the way.',
        'Cave dwellers swarm from every crack in the rock.',
        'The deep cavern hides something massive. Push on.',
        'Lava fields split the cavern. Mind your footing.',
        'The Hive Queen awaits. End the mutant threat.',
      ][i],
    composition: (total, lvl) =>
      splitCount(total, [
        { type: 'brute', weight: 3, level: lvl >= 2 ? 2 : 1 },
        { type: 'feral', weight: 2, level: lvl >= 2 ? 2 : 1 },
        { type: 'robotTank', weight: 1, level: lvl >= 3 ? 2 : 1 },
        // an alpha appears in the later chapters of the zone
        ...(lvl >= 3 ? [{ type: 'alpha' as UnitTypeId, weight: 1, level: 1 }] : []),
      ]),
  },
  // Zone 6: crater all enemy types, max difficulty; ch30 = final boss
  {
    arena: 'crater',
    baseCount: 28,
    titles: ["Crater's Edge", 'Hellfire', 'Endgame', 'The Reckoning', 'Machine God'],
    intro: 'The Overmind core burns at the bottom of the crater.',
    blurb: (i) =>
      [
        "The crater's edge bristles with machine guns. Advance.",
        'Hellfire rains down. The Overmind throws its legions at you.',
        'Endgame. There is no retreat from here.',
        'The reckoning. Humanity stands or falls in the next hour.',
        'The Machine God itself. The final stand of the human race.',
      ][i],
    composition: (total, lvl) => {
      // Final boss (chapter 30 / zone index 4): massive alpha + robot tank swarm.
      if (lvl >= 5) {
        return [
          { type: 'alpha', count: 4, level: 3 },
          { type: 'robotTank', count: Math.max(8, total - 12), level: 2 },
          { type: 'killerBot', count: 8, level: 2 },
        ];
      }
      return splitCount(total, [
        { type: 'killerBot', weight: 3, level: 2 },
        { type: 'robotTank', weight: 2, level: lvl >= 3 ? 2 : 1 },
        { type: 'brute', weight: 2, level: 2 },
        { type: 'alpha', weight: 1, level: 1 },
      ]);
    },
  },
];

// Unlocks granted on victory, spaced every 5 chapters.
const UNLOCK_AT: Record<number, UnitTypeId[]> = {
  0: ['heavy', 'medic'],
  4: ['biker', 'sniper'],
  9: ['bomber'],
  14: ['combatBot', 'warDrone'],
  19: ['mechWalker'],
  24: [],
};

function makeBriefing(zone: ZoneDef, globalIdx: number, zi: number): ChapterDef['briefing'] {
  const lines: ChapterDef['briefing'] = [];
  if (zi === 0) {
    lines.push({ speaker: 'NARRATOR', speakerColor: COL_NARRATOR, text: zone.intro });
  }
  lines.push({ speaker: 'CMDR REYES', speakerColor: COL_REYES, text: zone.blurb(zi) });
  // Final boss extra line
  if (globalIdx === 29) {
    lines.push({
      speaker: 'OVERMIND',
      speakerColor: COL_AI,
      text: 'COMMANDER. HUMANITY IS A FAILED ITERATION. I AM THE CORRECTION.',
    });
  } else if (zone.arena === 'industrial' && zi === 0) {
    lines.push({
      speaker: 'VERA (AI ally)',
      speakerColor: COL_VERA,
      text: 'Warning: automated defenders online. Killer Bots inbound.',
    });
  } else if (zi === 4) {
    lines.push({
      speaker: 'RAIDER',
      speakerColor: COL_ENEMY,
      text: 'You will bleed out here, flesh-thing. The wasteland keeps your bones.',
    });
  }
  return lines;
}

export const CAMPAIGN: ChapterDef[] = (() => {
  const chapters: ChapterDef[] = [];
  for (let zone = 0; zone < ZONES.length; zone++) {
    const z = ZONES[zone];
    for (let zi = 0; zi < 5; zi++) {
      const globalIdx = zone * 5 + zi;
      // total enemy count grows with chapter within the zone (+3..5 per step)
      const total = z.baseCount + zi * 4;
      const statScale = 1 + globalIdx * 0.2;
      const enemies = z.composition(total, zi + 1);
      const isFinal = globalIdx === 29;

      chapters.push({
        id: globalIdx,
        title: z.titles[zi],
        arena: z.arena,
        recommended: 80 + globalIdx * 40,
        reward: 100 + (globalIdx + 1) * 30,
        unlocks: UNLOCK_AT[globalIdx],
        statScale,
        // multi-lane flanking from chapter 6 (index 5) onward
        multiLane: globalIdx >= 5,
        briefing: makeBriefing(z, globalIdx, zi),
        victory: [
          {
            speaker: 'CMDR REYES',
            speakerColor: COL_REYES,
            text: isFinal
              ? 'It is over. The Machine God is silent. We won.'
              : 'The line holds. Another wave broken. Onward, soldiers.',
          },
          ...(UNLOCK_AT[globalIdx] && UNLOCK_AT[globalIdx].length > 0
            ? [
                {
                  speaker: 'NARRATOR',
                  speakerColor: COL_NARRATOR,
                  text: 'Salvage recovered from the field. New units are available.',
                },
              ]
            : []),
        ],
        defeat: [
          {
            speaker: 'CMDR REYES',
            speakerColor: COL_REYES,
            text: 'We are overrun. Fall back, regroup, and try again.',
          },
        ],
        enemies,
      });
    }
  }
  return chapters;
})();

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
