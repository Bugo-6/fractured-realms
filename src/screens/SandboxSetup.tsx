import React, { useMemo, useState } from 'react';
import type { ArenaType, BattleConfig, UnitTypeId } from '../game/types';
import { UNIT_DEFS, ALL_PLAYABLE, ALL_ENEMIES, hexToCss } from '../game/unitDefs';
import { ARENA_NAMES } from '../game/arenaBuilder';

interface SandboxSetupProps {
  onBack: () => void;
  onLaunch: (config: BattleConfig) => void;
}

const ALL_UNITS: UnitTypeId[] = [...ALL_PLAYABLE, ...ALL_ENEMIES];
const ARENAS: ArenaType[] = [
  'desertTown',
  'coastalRuins',
  'industrial',
  'desertOpen',
  'underground',
  'crater',
];

type Counts = Partial<Record<UnitTypeId, number>>;

export const SandboxSetup: React.FC<SandboxSetupProps> = ({ onBack, onLaunch }) => {
  const [arena, setArena] = useState<ArenaType>('crater');
  const [playerCounts, setPlayerCounts] = useState<Counts>({ rifleman: 8, heavy: 2 });
  const [enemyCounts, setEnemyCounts] = useState<Counts>({ zombie: 10, brute: 2 });

  const buildArmy = (counts: Counts): { type: UnitTypeId; level: number }[] => {
    const list: { type: UnitTypeId; level: number }[] = [];
    (Object.keys(counts) as UnitTypeId[]).forEach((t) => {
      const n = counts[t] ?? 0;
      for (let i = 0; i < n; i++) list.push({ type: t, level: 1 });
    });
    return list;
  };

  const playerTotal = useMemo(
    () =>
      (Object.values(playerCounts) as (number | undefined)[]).reduce(
        (a, b) => a + (b ?? 0),
        0,
      ),
    [playerCounts],
  );
  const enemyTotal = useMemo(
    () =>
      (Object.values(enemyCounts) as (number | undefined)[]).reduce(
        (a, b) => a + (b ?? 0),
        0,
      ),
    [enemyCounts],
  );

  const launch = () => {
    onLaunch({
      arena,
      playerArmy: buildArmy(playerCounts),
      enemyArmy: buildArmy(enemyCounts),
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-gradient-to-b from-[#10100c] to-black">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <button
          onClick={onBack}
          className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-orange-300"
        >
          &larr; Menu
        </button>
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-orange-200">
          Sandbox
        </h2>
        <div className="w-16" />
      </div>

      {/* Arena selector */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 px-5 py-3">
        {ARENAS.map((a) => (
          <button
            key={a}
            onClick={() => setArena(a)}
            className={[
              'rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors',
              arena === a
                ? 'bg-orange-600 text-white'
                : 'border border-white/15 bg-black/40 text-gray-300 hover:bg-white/10',
            ].join(' ')}
          >
            {ARENA_NAMES[a]}
          </button>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
        <ArmyColumn
          title="Your Army"
          accent="text-green-300"
          total={playerTotal}
          counts={playerCounts}
          setCounts={setPlayerCounts}
        />
        <ArmyColumn
          title="Enemy Army"
          accent="text-red-300"
          total={enemyTotal}
          counts={enemyCounts}
          setCounts={setEnemyCounts}
        />
      </div>

      <div className="border-t border-white/10 p-4">
        <button
          onClick={launch}
          disabled={playerTotal === 0 || enemyTotal === 0}
          className="w-full rounded-lg bg-gradient-to-r from-red-700 to-orange-600 py-3 text-sm font-black uppercase tracking-[0.3em] text-white shadow-lg enabled:hover:from-red-600 enabled:hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Start Skirmish
        </button>
      </div>
    </div>
  );
};

const ArmyColumn: React.FC<{
  title: string;
  accent: string;
  total: number;
  counts: Counts;
  setCounts: React.Dispatch<React.SetStateAction<Counts>>;
}> = ({ title, accent, total, counts, setCounts }) => {
  const set = (t: UnitTypeId, n: number) =>
    setCounts((c) => ({ ...c, [t]: Math.max(0, Math.min(40, n)) }));

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className={`text-sm font-black uppercase tracking-widest ${accent}`}>
          {title}
        </h3>
        <span className="text-xs text-gray-400">Total: {total}</span>
      </div>
      <div className="grid max-h-[52vh] grid-cols-1 gap-1.5 overflow-y-auto pr-1">
        {ALL_UNITS.map((t) => {
          const def = UNIT_DEFS[t];
          const n = counts[t] ?? 0;
          return (
            <div
              key={t}
              className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5"
              style={{ borderLeft: `3px solid ${hexToCss(def.color)}` }}
            >
              <span className="flex-1 truncate text-xs font-semibold text-gray-200">
                {def.name}
              </span>
              <button
                onClick={() => set(t, n - 1)}
                className="h-6 w-6 rounded bg-white/10 text-sm font-bold text-gray-300 hover:bg-white/20"
              >
                -
              </button>
              <span className="w-7 text-center text-sm font-bold text-gray-100">
                {n}
              </span>
              <button
                onClick={() => set(t, n + 1)}
                className="h-6 w-6 rounded bg-white/10 text-sm font-bold text-gray-300 hover:bg-white/20"
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
