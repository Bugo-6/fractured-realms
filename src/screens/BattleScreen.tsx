import React, { useState } from 'react';
import type { BattleConfig } from '../game/types';
import { BattleScene } from '../components/BattleScene';

interface BattleScreenProps {
  config: BattleConfig;
  title: string;
  onEnd: (winner: 'player' | 'enemy') => void;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  config,
  title,
  onEnd,
}) => {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const totalPlayer = config.playerArmy.length;
  const totalEnemy = config.enemyArmy.length;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <BattleScene
        config={config}
        paused={paused}
        speed={speed}
        onFinished={onEnd}
      />

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
        <div className="flex items-center gap-2 rounded-md bg-green-950/60 px-3 py-1.5 ring-1 ring-green-700/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-green-400">
            Your Forces
          </span>
          <span className="text-lg font-black text-green-300">{totalPlayer}</span>
        </div>

        <div className="truncate text-center text-xs font-bold uppercase tracking-[0.3em] text-orange-200">
          {title}
        </div>

        <div className="flex items-center gap-2 rounded-md bg-red-950/60 px-3 py-1.5 ring-1 ring-red-700/50">
          <span className="text-lg font-black text-red-300">{totalEnemy}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
            Hostiles
          </span>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
        <button
          onClick={() => setPaused((p) => !p)}
          className="rounded-md border border-white/20 bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-200 hover:bg-white/10"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>
        {[1, 2, 4].map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={[
              'rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
              speed === s
                ? 'bg-orange-600 text-white'
                : 'border border-white/20 bg-black/60 text-gray-300 hover:bg-white/10',
            ].join(' ')}
          >
            {s}x
          </button>
        ))}
        <button
          onClick={() => onEnd('enemy')}
          className="rounded-md border border-red-700/50 bg-red-950/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-900/60"
        >
          Retreat
        </button>
      </div>

      {paused && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="rounded-lg bg-black/60 px-8 py-4 text-2xl font-black uppercase tracking-[0.4em] text-white/80">
            Paused
          </span>
        </div>
      )}
    </div>
  );
};
