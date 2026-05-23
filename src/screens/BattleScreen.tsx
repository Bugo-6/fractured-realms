import React, { useState, useCallback } from 'react';
import { ArmyComp } from '../game/types';
import { BattleCanvas } from '../components/BattleCanvas';

interface Props {
  playerArmy: ArmyComp[];
  enemyArmy: ArmyComp[];
  chapterTitle: string;
  terrain: string;
  onEnd: (result: 'victory' | 'defeat') => void;
}

const SPEEDS = [1, 2, 4, 8];

export function BattleScreen({ playerArmy, enemyArmy, chapterTitle, terrain, onEnd }: Props) {
  const [teamCount, setTeamCount] = useState<[number, number]>([
    playerArmy.reduce((s, a) => s + a.count, 0),
    enemyArmy.reduce((s, a) => s + a.count, 0),
  ]);
  const [paused, setPaused] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const speed = SPEEDS[speedIdx];

  const handleUpdate = useCallback((tc: [number, number]) => setTeamCount(tc), []);

  return (
    <div className="min-h-screen bg-[#07050f] text-white flex flex-col">
      {/* HUD bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
        {/* Player count */}
        <div className="flex items-center gap-2 min-w-28">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-mono text-sm text-gray-300">YOUR FORCES</span>
          <span className="font-mono font-bold text-blue-400 text-lg ml-1">{teamCount[0]}</span>
        </div>

        {/* Chapter title + controls */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">{chapterTitle}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPaused(p => !p)}
              className={`px-3 py-1 rounded font-mono text-xs border transition-colors
                ${paused ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'}`}
            >
              {paused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>
            <button
              onClick={() => setSpeedIdx(i => (i + 1) % SPEEDS.length)}
              className="px-3 py-1 rounded font-mono text-xs border border-white/20 bg-white/10 hover:bg-white/20 text-gray-300 transition-colors"
            >
              {speed}× SPEED
            </button>
          </div>
        </div>

        {/* Enemy count */}
        <div className="flex items-center gap-2 min-w-28 justify-end">
          <span className="font-mono font-bold text-red-400 text-lg mr-1">{teamCount[1]}</span>
          <span className="font-mono text-sm text-gray-300">ENEMY</span>
          <div className="w-3 h-3 rounded-full bg-red-500" />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="w-full max-w-7xl">
          <BattleCanvas
            playerArmy={playerArmy}
            enemyArmy={enemyArmy}
            terrain={terrain}
            speedMultiplier={speed}
            isPaused={paused}
            onUpdate={handleUpdate}
            onEnd={onEnd}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pb-3 flex-wrap px-4">
        <span className="text-xs font-mono text-gray-600">UNITS:</span>
        <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> Your forces (blue ring)
        </span>
        <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Enemies (red ring)
        </span>
        <span className="text-xs font-mono text-gray-500">Letter = unit type · Color = faction</span>
      </div>
    </div>
  );
}
