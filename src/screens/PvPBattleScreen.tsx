import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ArenaType, BattleConfig, UnitTypeId, RosterEntry } from '../game/types';
import type { SpawnEvent } from '../multiplayer/types';
import { ARENA_COLLISION_ZONES } from '../game/arenaBuilder';
import { BattleScene } from '../components/BattleScene';
import { UNIT_DEFS, hexToCss } from '../game/unitDefs';
import { getSocket, disconnect } from '../multiplayer/socket';

interface Props {
  roomId: string;
  side: 'left' | 'right';
  arena: ArenaType;
  opponentName: string;
  roster: RosterEntry[];
  onEnd: (result: 'win' | 'loss') => void;
}

export const PvPBattleScreen: React.FC<Props> = ({
  side, arena, opponentName, roster, onEnd,
}) => {
  const [cp, setCp] = useState(150);
  const [maxCp, setMaxCp] = useState(150);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [ended, setEnded] = useState(false);

  const deployRef = useRef<((type: UnitTypeId, level: number) => boolean) | null>(null);
  const injectRef = useRef<((type: UnitTypeId, level: number) => void) | null>(null);
  const endedRef = useRef(false);

  const config = useMemo<BattleConfig>(() => ({
    arena,
    playerArmy: [],
    enemyArmy: [],
    statScale: 1,
    multiLane: false,
    collisionZones: ARENA_COLLISION_ZONES[arena],
    startingCP: 150,
    cpPerKill: 15,
    pendingDeployments: roster.flatMap(r =>
      Array.from({ length: r.count }, () => ({ type: r.type, level: r.level }))
    ),
  }), [arena, roster]);

  const cards = useMemo(() => {
    const pool = config.pendingDeployments ?? [];
    const cardMap = new Map<string, { type: UnitTypeId; level: number; cost: number; name: string; color: number; count: number }>();
    for (const p of pool) {
      const key = `${p.type}_${p.level}`;
      const ex = cardMap.get(key);
      if (ex) ex.count++;
      else {
        const def = UNIT_DEFS[p.type];
        cardMap.set(key, { type: p.type, level: p.level, cost: def.cost, name: def.name, color: def.color, count: 1 });
      }
    }
    return [...cardMap.values()].sort((a, b) => a.cost - b.cost);
  }, [config.pendingDeployments]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('room:spawn', (event: SpawnEvent) => {
      if (event.fromSocketId !== socket.id) {
        injectRef.current?.(event.unitType as UnitTypeId, event.level);
      }
    });
    socket.on('room:end', (winner: 'left' | 'right') => {
      if (endedRef.current) return;
      endedRef.current = true;
      setEnded(true);
      const won = winner === side;
      setTimeout(() => { disconnect(); onEnd(won ? 'win' : 'loss'); }, 1200);
    });
    return () => {
      socket.off('room:spawn');
      socket.off('room:end');
    };
  }, [side, onEnd]);

  const handleBattleEnd = useCallback((winner: 'player' | 'enemy') => {
    if (endedRef.current) return;
    endedRef.current = true;
    const reportedWinner: 'left' | 'right' = winner === 'player' ? side : (side === 'left' ? 'right' : 'left');
    getSocket().emit('room:end', reportedWinner);
  }, [side]);

  const handleCPUpdate = useCallback((next: number, nextMax: number) => {
    setCp(next);
    setMaxCp(m => Math.max(m, nextMax));
  }, []);

  const registerDeploy = useCallback(
    (fn: ((type: UnitTypeId, level: number) => boolean) | null) => { deployRef.current = fn; }, []);

  const registerInjectEnemy = useCallback(
    (fn: ((type: UnitTypeId, level: number) => void) | null) => { injectRef.current = fn; }, []);

  const deploy = useCallback((type: UnitTypeId, level: number) => {
    const ok = deployRef.current?.(type, level);
    if (ok) getSocket().emit('room:spawn', type, level);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <BattleScene
        config={config} paused={paused} speed={speed}
        onFinished={handleBattleEnd}
        onCPUpdate={handleCPUpdate}
        registerDeploy={registerDeploy}
        registerInjectEnemy={registerInjectEnemy}
      />

      {/* Top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
        <div className="flex items-center gap-2 rounded-md bg-blue-950/60 px-3 py-1.5 ring-1 ring-blue-700/50">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">CP</span>
          <span className="text-lg font-black text-blue-300">{Math.floor(cp)}</span>
        </div>
        <div className="truncate text-center text-xs font-bold uppercase tracking-[0.3em] text-blue-200">
          PvP — vs {opponentName}
        </div>
        <div className="rounded-md bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300">
          {side === 'left' ? '← You' : 'You →'}
        </div>
      </div>

      {/* Deploy panel */}
      {cards.length > 0 && (
        <div className="absolute left-3 top-1/2 z-10 flex max-h-[80vh] -translate-y-1/2 flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-black/70 p-3">
          <div className="text-center font-mono text-xs font-bold text-blue-300">{Math.floor(cp)} CP</div>
          <div className="mx-auto h-2 w-24 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-blue-400 transition-[width] duration-200"
              style={{ width: `${maxCp > 0 ? Math.min(100, (cp / maxCp) * 100) : 0}%` }} />
          </div>
          <div className="my-1 text-center text-[9px] uppercase tracking-widest text-gray-500">Deploy</div>
          {cards.map(card => {
            const afford = cp >= card.cost;
            return (
              <button key={`${card.type}_${card.level}`} onClick={() => deploy(card.type, card.level)} disabled={!afford}
                className={[
                  'flex w-24 items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-left transition-colors',
                  afford ? 'border-white/20 bg-white/5 hover:bg-white/15' : 'cursor-not-allowed border-white/5 bg-black/40 opacity-40',
                ].join(' ')}
                style={{ borderLeft: `3px solid ${hexToCss(card.color)}` }}
              >
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded text-xs font-black"
                  style={{ backgroundColor: hexToCss(card.color) + '33', color: hexToCss(card.color) }}>
                  {card.name.charAt(0)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-gray-200">
                  {card.name}{card.level > 1 ? ` L${card.level}` : ''}
                </span>
                <span className="flex-none font-mono text-[10px] font-bold text-blue-300">{card.cost}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Controls */}
      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
        <button onClick={() => setPaused(p => !p)}
          className="rounded-md border border-white/20 bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-200 hover:bg-white/10">
          {paused ? 'Resume' : 'Pause'}
        </button>
        {[1, 2].map(s => (
          <button key={s} onClick={() => setSpeed(s)}
            className={['rounded-md px-3 py-2 text-xs font-bold uppercase tracking-widest transition-colors',
              speed === s ? 'bg-blue-600 text-white' : 'border border-white/20 bg-black/60 text-gray-300 hover:bg-white/10',
            ].join(' ')}>
            {s}x
          </button>
        ))}
        <button onClick={() => handleBattleEnd('enemy')}
          className="rounded-md border border-red-700/50 bg-red-950/60 px-4 py-2 text-xs font-bold uppercase tracking-widest text-red-300 hover:bg-red-900/60">
          Surrender
        </button>
      </div>

      {ended && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <span className="rounded-lg bg-black/80 px-10 py-6 text-3xl font-black uppercase tracking-[0.3em] text-white">
            Battle Ending...
          </span>
        </div>
      )}
    </div>
  );
};
