import React, { useState } from 'react';
import { ArmyComp, UnitClassId } from '../game/types';
import { UNIT_DEFS, PLAYABLE_UNITS } from '../game/unitDefs';
import { SANDBOX_ENEMY_PRESETS } from '../game/campaign';

interface Props {
  onBattle: (playerArmy: ArmyComp[], enemyArmy: ArmyComp[]) => void;
  onBack: () => void;
}

function ArmyBuilder({ title, color, army, onChange, unlimited }: {
  title: string; color: string; army: ArmyComp[];
  onChange: (a: ArmyComp[]) => void; unlimited?: boolean;
}) {
  function getCount(id: UnitClassId) { return army.find(a => a.classId === id)?.count ?? 0; }
  function setCount(id: UnitClassId, count: number) {
    const w = army.filter(a => a.classId !== id);
    onChange(count > 0 ? [...w, { classId: id, count }] : w);
  }

  return (
    <div className="flex-1 min-w-0">
      <h3 className="text-xs font-mono tracking-widest uppercase mb-3" style={{ color }}>{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PLAYABLE_UNITS.map(classId => {
          const def = UNIT_DEFS[classId];
          const count = getCount(classId);
          return (
            <div
              key={classId}
              className={`rounded-lg border p-2 flex flex-col gap-1 transition-colors
                ${count > 0 ? 'border-blue-500/50 bg-blue-900/20' : 'border-white/10 bg-white/5'}`}
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                  style={{ background: `${def.color}22`, border: `1.5px solid ${def.color}` }}
                >
                  {def.letter}
                </div>
                <span className="text-xs truncate">{def.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setCount(classId, count - 1)} disabled={count === 0}
                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 font-bold text-sm flex items-center justify-center">
                  −
                </button>
                <span className="flex-1 text-center font-mono text-sm font-bold">{count || '·'}</span>
                <button onClick={() => setCount(classId, count + 5)}
                  className="w-6 h-6 rounded bg-blue-600/60 hover:bg-blue-500 font-bold text-sm flex items-center justify-center">
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-xs font-mono text-gray-500 text-right">
        Total: {army.reduce((s, a) => s + a.count, 0)} units
      </div>
    </div>
  );
}

export function SandboxSetup({ onBattle, onBack }: Props) {
  const [playerArmy, setPlayerArmy] = useState<ArmyComp[]>([{ classId: 'knight', count: 20 }]);
  const [enemyArmy, setEnemyArmy] = useState<ArmyComp[]>([{ classId: 'orc', count: 30 }]);
  const [enemyTab, setEnemyTab] = useState<'preset' | 'custom'>('preset');

  const canBattle = playerArmy.reduce((s, a) => s + a.count, 0) > 0
    && enemyArmy.reduce((s, a) => s + a.count, 0) > 0;

  // Enemy unit options (include enemy-only units for sandbox)
  const ENEMY_ONLY: UnitClassId[] = ['orc', 'zombie', 'robot', 'void_creature', 'void_titan'];
  const allEnemyUnits = [...PLAYABLE_UNITS, ...ENEMY_ONLY];

  function getEnemyCount(id: UnitClassId) { return enemyArmy.find(a => a.classId === id)?.count ?? 0; }
  function setEnemyCount(id: UnitClassId, count: number) {
    const w = enemyArmy.filter(a => a.classId !== id);
    setEnemyArmy(count > 0 ? [...w, { classId: id, count }] : w);
  }

  return (
    <div className="min-h-screen bg-[#07050f] text-white flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onBack} className="text-gray-400 hover:text-white font-mono text-sm">← Menu</button>
        <h2 className="font-black text-xl uppercase tracking-widest text-gray-200 font-mono">Sandbox Mode</h2>
        <div />
      </div>

      <div className="flex-1 p-6 flex flex-col lg:flex-row gap-6 overflow-y-auto">
        {/* Player army */}
        <ArmyBuilder
          title="Your Army"
          color="#60a5fa"
          army={playerArmy}
          onChange={setPlayerArmy}
          unlimited
        />

        <div className="flex items-center justify-center">
          <div className="text-4xl text-gray-600">⚔</div>
        </div>

        {/* Enemy army */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-3">
            {(['preset', 'custom'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setEnemyTab(tab)}
                className={`px-3 py-1 rounded font-mono text-xs uppercase border transition-colors
                  ${enemyTab === tab ? 'bg-red-900/40 border-red-600/50 text-red-300' : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
            <span className="text-xs font-mono text-red-400 self-center ml-auto">Enemy Forces</span>
          </div>

          {enemyTab === 'preset' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SANDBOX_ENEMY_PRESETS.map(preset => {
                const isActive = JSON.stringify(preset.army) === JSON.stringify(enemyArmy);
                return (
                  <button
                    key={preset.label}
                    onClick={() => setEnemyArmy(preset.army)}
                    className={`rounded-lg border p-3 text-left transition-all hover:scale-[1.02]
                      ${isActive ? 'border-red-500/60 bg-red-900/25' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                  >
                    <div className="font-semibold text-sm">{preset.label}</div>
                    <div className="text-xs text-gray-500 font-mono mt-1">
                      {preset.army.map(a => `${a.count}× ${UNIT_DEFS[a.classId].name}`).join(', ')}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allEnemyUnits.map(classId => {
                const def = UNIT_DEFS[classId];
                const count = getEnemyCount(classId);
                return (
                  <div
                    key={classId}
                    className={`rounded-lg border p-2 flex flex-col gap-1 transition-colors
                      ${count > 0 ? 'border-red-500/50 bg-red-900/20' : 'border-white/10 bg-white/5'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0"
                        style={{ background: `${def.color}22`, border: `1.5px solid ${def.color}` }}
                      >
                        {def.letter}
                      </div>
                      <span className="text-xs truncate">{def.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEnemyCount(classId, count - 1)} disabled={count === 0}
                        className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 font-bold text-sm flex items-center justify-center">
                        −
                      </button>
                      <span className="flex-1 text-center font-mono text-sm font-bold">{count || '·'}</span>
                      <button onClick={() => setEnemyCount(classId, count + 5)}
                        className="w-6 h-6 rounded bg-red-600/60 hover:bg-red-500 font-bold text-sm flex items-center justify-center">
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="mt-2 text-xs font-mono text-gray-500 text-right">
            Total: {enemyArmy.reduce((s, a) => s + a.count, 0)} units
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 p-4 flex justify-center">
        <button
          onClick={() => canBattle && onBattle(playerArmy, enemyArmy)}
          disabled={!canBattle}
          className={`px-12 py-3 rounded-xl font-bold font-mono uppercase tracking-wider text-lg transition-all
            ${canBattle ? 'bg-amber-500 hover:bg-amber-400 text-black hover:scale-105' : 'bg-white/10 text-gray-500 cursor-not-allowed'}`}
        >
          Simulate Battle →
        </button>
      </div>
    </div>
  );
}
