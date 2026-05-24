import React, { useMemo, useState } from 'react';
import type { ChapterDef, RosterEntry, SaveState, UnitTypeId } from '../game/types';
import { UNIT_DEFS, leveledStats, hexToCss } from '../game/unitDefs';
import { ARENA_NAMES } from '../game/arenaBuilder';

interface PreBattleProps {
  chapter: ChapterDef;
  save: SaveState;
  onBack: () => void;
  onUpdateRoster: (roster: RosterEntry[], gold: number) => void;
  onLaunch: (army: { type: UnitTypeId; level: number }[]) => void;
}

// Short labels + colors for the hard-counter damage types.
const DMG_BADGE: Record<string, { label: string; color: string }> = {
  bullet: { label: 'BULLET', color: '#fbbf24' },
  explosive: { label: 'EXPLO', color: '#f97316' },
  energy: { label: 'ENERGY', color: '#22d3ee' },
  melee: { label: 'MELEE', color: '#a3a3a3' },
  heal: { label: 'HEAL', color: '#4ade80' },
};

const ARMOR_LABEL: Record<string, string> = {
  flesh: 'Flesh',
  armored: 'Armored',
  heavy: 'Heavy',
};

const UNIT_ICON: Record<string, string> = {
  scout: '\u{1F575}',
  rifleman: '\u{1F52B}',
  heavy: '\u{1F4A5}',
  medic: '\u{271A}',
  biker: '\u{1F3CD}',
  bomber: '\u{1F4A3}',
  sniper: '\u{1F3AF}',
  combatBot: '\u{1F916}',
  warDrone: '\u{1F681}',
  mechWalker: '\u{1F6F8}',
  zombie: '\u{1F9DF}',
  feral: '\u{1F43A}',
  brute: '\u{1F479}',
  alpha: '\u{1F47E}',
  killerBot: '\u{2699}',
  robotTank: '\u{1F69C}',
};

export const PreBattle: React.FC<PreBattleProps> = ({
  chapter,
  save,
  onBack,
  onUpdateRoster,
  onLaunch,
}) => {
  // local working copy of how many of each owned unit to deploy
  const ownedRoster = save.roster;
  const [deploy, setDeploy] = useState<Record<string, number>>(() => {
    const d: Record<string, number> = {};
    for (const r of ownedRoster) d[r.type] = r.count; // deploy all by default
    return d;
  });
  const [dialogIdx, setDialogIdx] = useState(0);
  const [showShop, setShowShop] = useState(false);

  const totalDeployed = useMemo(
    () =>
      (Object.values(deploy) as number[]).reduce(
        (a, b) => a + (b ?? 0),
        0,
      ),
    [deploy],
  );

  const army = useMemo(() => {
    const list: { type: UnitTypeId; level: number }[] = [];
    for (const r of ownedRoster) {
      const n = deploy[r.type] ?? 0;
      for (let i = 0; i < n; i++) list.push({ type: r.type, level: r.level });
    }
    return list;
  }, [deploy, ownedRoster]);

  const setDeployCount = (type: UnitTypeId, n: number) => {
    const owned = ownedRoster.find((r) => r.type === type)?.count ?? 0;
    setDeploy((d) => ({ ...d, [type]: Math.max(0, Math.min(owned, n)) }));
  };

  const line = chapter.briefing[Math.min(dialogIdx, chapter.briefing.length - 1)];
  const briefingDone = dialogIdx >= chapter.briefing.length - 1;

  // ---- Shop actions ----
  const buyUnit = (type: UnitTypeId) => {
    const def = UNIT_DEFS[type];
    if (save.gold < def.cost) return;
    const roster = ownedRoster.map((r) => ({ ...r }));
    const entry = roster.find((r) => r.type === type);
    if (entry) entry.count += 1;
    else roster.push({ type, count: 1, level: 1 });
    onUpdateRoster(roster, save.gold - def.cost);
    setDeploy((d) => ({ ...d, [type]: (d[type] ?? 0) + 1 }));
  };

  const upgradeCost = (level: number) => (level === 1 ? 60 : 120);
  const upgradeUnit = (type: UnitTypeId) => {
    const roster = ownedRoster.map((r) => ({ ...r }));
    const entry = roster.find((r) => r.type === type);
    if (!entry || entry.level >= 3) return;
    const cost = upgradeCost(entry.level);
    if (save.gold < cost) return;
    entry.level += 1;
    onUpdateRoster(roster, save.gold - cost);
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#14100c] to-black md:flex-row">
      {/* LEFT: story */}
      <div className="flex w-full flex-col border-b border-orange-900/40 bg-black/40 p-5 md:w-2/5 md:border-b-0 md:border-r">
        <button
          onClick={onBack}
          className="mb-3 self-start text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-orange-300"
        >
          &larr; Map
        </button>
        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/70">
          Chapter {chapter.id + 1} &middot; {ARENA_NAMES[chapter.arena]}
        </span>
        <h2 className="mb-4 text-2xl font-black text-orange-100">{chapter.title}</h2>

        <div className="flex flex-1 flex-col">
          <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4">
            <div
              className="flex h-12 w-12 flex-none items-center justify-center rounded-full text-xl font-black"
              style={{
                backgroundColor: hexToCss(line.speakerColor) + '33',
                border: `2px solid ${hexToCss(line.speakerColor)}`,
                color: hexToCss(line.speakerColor),
              }}
            >
              {line.speaker.charAt(0)}
            </div>
            <div className="min-w-0">
              <div
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: hexToCss(line.speakerColor) }}
              >
                {line.speaker}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-gray-200">
                {line.text}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {!briefingDone ? (
              <button
                onClick={() => setDialogIdx((i) => i + 1)}
                className="rounded-md bg-orange-700/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-orange-100 hover:bg-orange-600"
              >
                Next &rarr;
              </button>
            ) : (
              <span className="text-xs italic text-gray-600">
                Briefing done. Choose your pool, then deploy with CP in battle &rarr;
              </span>
            )}
            <div className="ml-auto flex gap-1">
              {chapter.briefing.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i <= dialogIdx ? 'bg-orange-400' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Enemy preview */}
          <div className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-red-400">
              Hostiles Detected
            </h3>
            <div className="flex flex-wrap gap-2">
              {chapter.enemies.map((e, i) => {
                const def = UNIT_DEFS[e.type];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md border border-red-900/50 bg-red-950/30 px-2.5 py-1.5"
                  >
                    <span className="text-lg">{UNIT_ICON[e.type]}</span>
                    <div className="leading-tight">
                      <div className="text-xs font-bold text-red-200">
                        {def.name}
                      </div>
                      <div className="text-[10px] text-red-400/70">x{e.count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: army builder */}
      <div className="flex w-full flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-widest text-green-300">
            Deployment Pool
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Deployed: <b className="text-green-300">{totalDeployed}</b>
            </span>
            <button
              onClick={() => setShowShop((s) => !s)}
              className="rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-300 hover:bg-amber-900/40"
            >
              {showShop ? 'Close Shop' : 'Shop / Upgrade'}
            </button>
            <span className="rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-sm font-bold text-amber-300">
              {save.gold}g
            </span>
          </div>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {ownedRoster.length === 0 && (
            <p className="col-span-full text-sm text-gray-500">
              No units owned. Open the shop to recruit forces.
            </p>
          )}
          {ownedRoster.map((r) => {
            const def = UNIT_DEFS[r.type];
            const stats = leveledStats(def, r.level);
            const n = deploy[r.type] ?? 0;
            return (
              <div
                key={r.type}
                className="rounded-lg border border-white/10 bg-white/5 p-3"
                style={{ borderLeft: `3px solid ${hexToCss(def.color)}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{UNIT_ICON[r.type]}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-bold text-gray-100">
                        {def.name}
                      </span>
                      <span
                        className="rounded px-1 text-[9px] font-black"
                        style={{
                          backgroundColor: hexToCss(def.color) + '33',
                          color: hexToCss(def.color),
                        }}
                      >
                        Lv{r.level}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      HP {stats.hp} &middot; DMG {stats.dmg} &middot; {def.cost} CP &middot; Owned {r.count}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="rounded px-1 text-[8px] font-black tracking-wider"
                        style={{
                          backgroundColor: (DMG_BADGE[def.damageType]?.color ?? '#888') + '33',
                          color: DMG_BADGE[def.damageType]?.color ?? '#888',
                        }}
                      >
                        {DMG_BADGE[def.damageType]?.label ?? def.damageType}
                      </span>
                      <span className="text-[8px] uppercase text-gray-600">
                        {ARMOR_LABEL[def.armorType] ?? def.armorType} armor
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() => setDeployCount(r.type, n - 1)}
                    className="h-7 w-7 rounded bg-white/10 text-sm font-bold text-gray-300 hover:bg-white/20"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-green-300">
                    {n}
                  </span>
                  <button
                    onClick={() => setDeployCount(r.type, n + 1)}
                    className="h-7 w-7 rounded bg-white/10 text-sm font-bold text-gray-300 hover:bg-white/20"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setDeployCount(r.type, r.count)}
                    className="ml-auto rounded bg-white/5 px-2 py-1 text-[10px] uppercase text-gray-400 hover:bg-white/10"
                  >
                    All
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shop drawer */}
        {showShop && (
          <div className="mt-3 rounded-lg border border-amber-700/40 bg-black/60 p-3">
            <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
              Recruit & Upgrade
            </h4>
            <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
              {save.unlocked.map((type) => {
                const def = UNIT_DEFS[type];
                const entry = ownedRoster.find((r) => r.type === type);
                const level = entry?.level ?? 1;
                const canUpgrade = level < 3;
                const upCost = upgradeCost(level);
                return (
                  <div
                    key={type}
                    className="rounded-md border border-white/10 bg-white/5 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{UNIT_ICON[type]}</span>
                      <span className="flex-1 truncate text-xs font-bold text-gray-100">
                        {def.name}
                      </span>
                      <span className="text-[9px] text-gray-500">Lv{level}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button
                        onClick={() => buyUnit(type)}
                        disabled={save.gold < def.cost}
                        className="flex-1 rounded bg-green-800/50 px-2 py-1 text-[10px] font-bold uppercase text-green-200 enabled:hover:bg-green-700/60 disabled:opacity-40"
                      >
                        Buy {def.cost}g
                      </button>
                      <button
                        onClick={() => upgradeUnit(type)}
                        disabled={!entry || !canUpgrade || save.gold < upCost}
                        className="flex-1 rounded bg-cyan-800/50 px-2 py-1 text-[10px] font-bold uppercase text-cyan-200 enabled:hover:bg-cyan-700/60 disabled:opacity-40"
                      >
                        {canUpgrade ? `Up ${upCost}g` : 'Max'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={() => onLaunch(army)}
          disabled={totalDeployed === 0}
          className="mt-4 rounded-lg bg-gradient-to-r from-red-700 to-orange-600 py-3 text-sm font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-red-900/40 enabled:hover:from-red-600 enabled:hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {totalDeployed === 0 ? 'Add at least one unit to your pool' : 'Engage'}
        </button>
      </div>
    </div>
  );
};
