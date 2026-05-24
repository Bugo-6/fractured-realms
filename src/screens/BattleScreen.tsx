import React, { useMemo, useRef, useState, useCallback } from 'react';
import type { BattleConfig, UnitTypeId } from '../game/types';
import { BattleScene } from '../components/BattleScene';
import { UNIT_DEFS, hexToCss } from '../game/unitDefs';

interface BattleScreenProps {
  config: BattleConfig;
  title: string;
  onEnd: (winner: 'player' | 'enemy') => void;
}

interface DeployCard {
  type: UnitTypeId;
  level: number;
  cost: number;
  name: string;
  color: number;
  count: number; // how many of this type are in the pool
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  config,
  title,
  onEnd,
}) => {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cp, setCp] = useState(config.startingCP ?? 0);
  const [maxCp, setMaxCp] = useState(config.startingCP ?? 0);

  // Imperative deploy handle registered by BattleScene.
  const deployRef = useRef<((type: UnitTypeId, level: number) => boolean) | null>(null);

  const handleCPUpdate = useCallback((next: number, nextMax: number) => {
    setCp(next);
    setMaxCp((m) => Math.max(m, nextMax));
  }, []);

  const registerDeploy = useCallback(
    (fn: ((type: UnitTypeId, level: number) => boolean) | null) => {
      deployRef.current = fn;
    },
    [],
  );

  // Build the unique deployment cards from the pending pool.
  const cards = useMemo<DeployCard[]>(() => {
    const pool = config.pendingDeployments ?? [];
    const byType = new Map<string, DeployCard>();
    for (const p of pool) {
      const def = UNIT_DEFS[p.type];
      const key = `${p.type}_${p.level}`;
      const existing = byType.get(key);
      if (existing) existing.count += 1;
      else
        byType.set(key, {
          type: p.type,
          level: p.level,
          cost: def.cost,
          name: def.name,
          color: def.color,
          count: 1,
        });
    }
    return Array.from(byType.values()).sort((a, b) => a.cost - b.cost);
  }, [config.pendingDeployments]);

  const hasDeployPool = cards.length > 0;

  const deploy = useCallback((type: UnitTypeId, level: number) => {
    deployRef.current?.(type, level);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <BattleScene
        config={config}
        paused={paused}
        speed={speed}
        onFinished={onEnd}
        onCPUpdate={handleCPUpdate}
        registerDeploy={registerDeploy}
      />

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
        <div className="flex items-center gap-2 rounded-md bg-amber-950/60 px-3 py-1.5 ring-1 ring-amber-700/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Command Pts
          </span>
          <span className="text-lg font-black text-amber-300">{Math.floor(cp)}</span>
        </div>

        <div className="truncate text-center text-xs font-bold uppercase tracking-[0.3em] text-orange-200">
          {title}
        </div>

        <div className="flex items-center gap-2 rounded-md bg-red-950/60 px-3 py-1.5 ring-1 ring-red-700/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
            Hostiles
          </span>
        </div>
      </div>

      {/* Left sidebar: CP + deployment panel */}
      {hasDeployPool && (
        <div className="absolute left-3 top-1/2 z-10 flex max-h-[80vh] -translate-y-1/2 flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-black/70 p-3">
          <div className="text-center font-mono text-xs font-bold text-amber-300">
            {Math.floor(cp)} CP
          </div>
          <div className="mx-auto h-2 w-24 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-amber-400 transition-[width] duration-200"
              style={{ width: `${maxCp > 0 ? Math.min(100, (cp / maxCp) * 100) : 0}%` }}
            />
          </div>
          <div className="my-1 text-center text-[9px] uppercase tracking-widest text-gray-500">
            Deploy
          </div>
          {cards.map((card) => {
            const afford = cp >= card.cost;
            return (
              <button
                key={`${card.type}_${card.level}`}
                onClick={() => deploy(card.type, card.level)}
                disabled={!afford}
                className={[
                  'flex w-24 items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-left transition-colors',
                  afford
                    ? 'border-white/20 bg-white/5 hover:bg-white/15'
                    : 'cursor-not-allowed border-white/5 bg-black/40 opacity-40',
                ].join(' ')}
                style={{ borderLeft: `3px solid ${hexToCss(card.color)}` }}
              >
                <span
                  className="flex h-6 w-6 flex-none items-center justify-center rounded text-xs font-black"
                  style={{
                    backgroundColor: hexToCss(card.color) + '33',
                    color: hexToCss(card.color),
                  }}
                >
                  {card.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-gray-200">
                  {card.name}
                  {card.level > 1 ? ` L${card.level}` : ''}
                </span>
                <span className="flex-none font-mono text-[10px] font-bold text-amber-300">
                  {card.cost}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
