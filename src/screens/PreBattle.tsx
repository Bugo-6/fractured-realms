import React, { useState } from 'react';
import { Chapter } from '../game/types';
import { ArmyComp, UnitClassId } from '../game/types';
import { UNIT_DEFS, PLAYABLE_UNITS, FACTION_COLORS } from '../game/unitDefs';

interface Props {
  chapter: Chapter;
  gold: number;
  unlockedUnits: UnitClassId[];
  initialArmy: ArmyComp[];
  onBattle: (army: ArmyComp[]) => void;
  onBack: () => void;
}

export function PreBattle({ chapter, gold, unlockedUnits, initialArmy, onBattle, onBack }: Props) {
  const [army, setArmy] = useState<ArmyComp[]>(initialArmy);

  const armyGoldCost = army.reduce((sum, item) => {
    return sum + UNIT_DEFS[item.classId].cost * item.count;
  }, 0);

  const remaining = gold - armyGoldCost;

  function getCount(classId: UnitClassId): number {
    return army.find(a => a.classId === classId)?.count ?? 0;
  }

  function setCount(classId: UnitClassId, count: number) {
    if (count < 0) return;
    const cost = UNIT_DEFS[classId].cost;
    const current = getCount(classId);
    const diff = count - current;
    if (diff > 0 && diff * cost > remaining) return; // not enough gold
    setArmy(prev => {
      const without = prev.filter(a => a.classId !== classId);
      if (count === 0) return without;
      return [...without, { classId, count }];
    });
  }

  const totalUnits = army.reduce((s, a) => s + a.count, 0);
  const canFight = totalUnits > 0;

  const factions = Array.from(
    new Set(PLAYABLE_UNITS.filter(id => unlockedUnits.includes(id)).map(id => UNIT_DEFS[id].faction))
  );

  return (
    <div className="min-h-screen bg-[#07050f] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onBack} className="text-gray-400 hover:text-white font-mono text-sm transition-colors">
          ← Campaign
        </button>
        <div className="text-center">
          <div className="text-xs text-gray-500 font-mono">{chapter.subtitle}</div>
          <div className="font-black text-lg uppercase tracking-wider">{chapter.title}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400">◆</span>
          <span className={`font-mono font-bold ${remaining < 0 ? 'text-red-400' : 'text-amber-300'}`}>{remaining}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Left: Story */}
        <div className="lg:w-80 flex-shrink-0 p-6 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-mono tracking-widest text-purple-400 uppercase mb-2">Briefing</h3>
            <p className="text-sm text-gray-300 leading-relaxed">{chapter.preStory}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-400 italic">{chapter.quoteA}</p>
            <p className="text-sm text-blue-300 italic">{chapter.quoteB}</p>
          </div>

          {/* Enemy preview */}
          <div className="mt-auto">
            <h3 className="text-xs font-mono tracking-widest text-red-400 uppercase mb-2">Enemy Forces</h3>
            <div className="space-y-1">
              {chapter.enemyArmy.map(item => (
                <div key={item.classId} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-mono font-bold"
                      style={{ background: `${UNIT_DEFS[item.classId].color}33`, border: `1px solid ${UNIT_DEFS[item.classId].color}` }}
                    >
                      {UNIT_DEFS[item.classId].letter}
                    </div>
                    <span className="text-sm text-gray-300">{UNIT_DEFS[item.classId].name}</span>
                  </div>
                  <span className="text-sm font-mono text-red-400 font-bold">×{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Army builder */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono tracking-widest text-blue-400 uppercase">Your Army</h3>
            <span className="text-xs font-mono text-gray-500">{totalUnits} units deployed</span>
          </div>

          {factions.map(faction => {
            const units = PLAYABLE_UNITS.filter(
              id => unlockedUnits.includes(id) && UNIT_DEFS[id].faction === faction
            );
            if (units.length === 0) return null;
            const color = FACTION_COLORS[faction] ?? '#888';

            return (
              <div key={faction} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-mono tracking-wider uppercase" style={{ color }}>{faction}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {units.map(classId => {
                    const def = UNIT_DEFS[classId];
                    const count = getCount(classId);
                    const canAdd = def.cost <= remaining;

                    return (
                      <div
                        key={classId}
                        className={`rounded-lg border p-3 flex flex-col gap-2 transition-colors
                          ${count > 0 ? 'border-blue-500/50 bg-blue-900/20' : 'border-white/10 bg-white/5'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm"
                            style={{ background: `${def.color}22`, border: `1.5px solid ${def.color}` }}
                          >
                            {def.letter}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{def.name}</div>
                            <div className="text-xs text-amber-400 font-mono">◆{def.cost} each</div>
                          </div>
                        </div>

                        <div className="flex items-center text-xs text-gray-500 gap-2 font-mono">
                          <span title="HP">❤ {def.hp}</span>
                          <span title="DMG">⚔ {def.damage}</span>
                          <span title={def.isRanged ? 'Ranged' : 'Melee'}>{def.isRanged ? '🏹' : '⚔️'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCount(classId, count - 1)}
                            disabled={count === 0}
                            className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 font-bold text-lg flex items-center justify-center transition-colors"
                          >
                            −
                          </button>
                          <span className="flex-1 text-center font-mono font-bold text-lg">
                            {count > 0 ? count : '·'}
                          </span>
                          <button
                            onClick={() => setCount(classId, count + 1)}
                            disabled={!canAdd}
                            className="w-7 h-7 rounded bg-blue-600/60 hover:bg-blue-500 disabled:opacity-30 font-bold flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: battle button */}
      <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="text-sm font-mono text-gray-400">
          Cost: <span className="text-amber-300 font-bold">◆{armyGoldCost}</span>
          <span className="text-gray-600 mx-2">·</span>
          Remaining: <span className={`font-bold ${remaining < 50 ? 'text-red-400' : 'text-green-400'}`}>◆{remaining}</span>
        </div>
        <button
          onClick={() => canFight && onBattle(army)}
          disabled={!canFight}
          className={`px-8 py-3 rounded-lg font-bold font-mono uppercase tracking-wider transition-all
            ${canFight
              ? 'bg-amber-500 hover:bg-amber-400 text-black hover:scale-105'
              : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
        >
          Deploy & Fight →
        </button>
      </div>
    </div>
  );
}
