import React, { useEffect, useRef, useState } from 'react';
import type {
  ChapterDef,
  DialogueLine,
  RosterEntry,
  SaveState,
  UnitTypeId,
} from '../game/types';
import { UNIT_DEFS, leveledStats, hexToCss } from '../game/unitDefs';

interface PostBattleProps {
  result: 'player' | 'enemy';
  chapter: ChapterDef;
  goldEarned: number;
  newUnlocks: UnitTypeId[];
  save: SaveState;
  onApplyRewards: () => SaveState; // applies gold/unlocks, returns updated save
  onUpgrade: (roster: RosterEntry[], gold: number) => void;
  onContinue: () => void;
}

// Typewriter effect for a sequence of dialogue lines.
function useTypewriter(lines: DialogueLine[]) {
  const [lineIdx, setLineIdx] = useState(0);
  const [shown, setShown] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    setShown('');
    idxRef.current = 0;
    const full = lines[Math.min(lineIdx, lines.length - 1)]?.text ?? '';
    const t = window.setInterval(() => {
      idxRef.current += 1;
      setShown(full.slice(0, idxRef.current));
      if (idxRef.current >= full.length) window.clearInterval(t);
    }, 22);
    return () => window.clearInterval(t);
  }, [lineIdx, lines]);

  const advance = () => {
    if (lineIdx < lines.length - 1) setLineIdx((i) => i + 1);
  };
  const done = lineIdx >= lines.length - 1;
  return { line: lines[Math.min(lineIdx, lines.length - 1)], shown, advance, done };
}

export const PostBattle: React.FC<PostBattleProps> = ({
  result,
  chapter,
  goldEarned,
  newUnlocks,
  save,
  onApplyRewards,
  onUpgrade,
  onContinue,
}) => {
  const isVictory = result === 'player';
  const lines = isVictory ? chapter.victory : chapter.defeat;
  const { line, shown, advance, done } = useTypewriter(lines);

  // Apply rewards once on mount (for victory). Keep updated save locally.
  const [liveSave, setLiveSave] = useState<SaveState>(save);
  const appliedRef = useRef(false);
  useEffect(() => {
    if (!appliedRef.current) {
      appliedRef.current = true;
      const next = onApplyRewards();
      setLiveSave(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showUpgrade, setShowUpgrade] = useState(false);

  const upgradeCost = (level: number) => (level === 1 ? 60 : 120);
  const upgradeUnit = (type: UnitTypeId) => {
    const roster = liveSave.roster.map((r) => ({ ...r }));
    const entry = roster.find((r) => r.type === type);
    if (!entry || entry.level >= 3) return;
    const cost = upgradeCost(entry.level);
    if (liveSave.gold < cost) return;
    entry.level += 1;
    const gold = liveSave.gold - cost;
    const next = { ...liveSave, roster, gold };
    setLiveSave(next);
    onUpgrade(roster, gold);
  };

  return (
    <div
      className={[
        'relative flex h-full w-full flex-col items-center overflow-y-auto px-5 py-8',
        isVictory
          ? 'bg-gradient-to-b from-[#0a1f10] via-[#06120a] to-black'
          : 'bg-gradient-to-b from-[#1f0a0a] via-[#120606] to-black',
      ].join(' ')}
    >
      <div className="w-full max-w-xl">
        <h1
          className={[
            'text-center text-5xl font-black uppercase tracking-tight drop-shadow-lg sm:text-6xl',
            isVictory ? 'text-green-400' : 'text-red-500',
          ].join(' ')}
        >
          {isVictory ? 'Victory' : 'Defeat'}
        </h1>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.3em] text-gray-500">
          Chapter {chapter.id + 1} &middot; {chapter.title}
        </p>

        {/* Dialogue */}
        <div
          className="mt-6 min-h-[110px] cursor-pointer rounded-lg border border-white/10 bg-black/50 p-4"
          onClick={advance}
        >
          <div
            className="text-xs font-bold uppercase tracking-wider"
            style={{ color: hexToCss(line.speakerColor) }}
          >
            {line.speaker}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-200">{shown}</p>
          {!done && (
            <p className="mt-2 text-right text-[10px] uppercase tracking-widest text-gray-600">
              Click to continue
            </p>
          )}
        </div>

        {/* Rewards */}
        {isVictory && (goldEarned > 0 || newUnlocks.length > 0) && (
          <div className="mt-4 rounded-lg border border-amber-700/40 bg-amber-950/20 p-4">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-amber-300">
              Rewards
            </h3>
            {goldEarned > 0 && (
              <div className="text-sm text-amber-200">
                + <b>{goldEarned}</b> gold
              </div>
            )}
            {newUnlocks.length > 0 && (
              <div className="mt-1 text-sm text-cyan-200">
                Unlocked:{' '}
                {newUnlocks.map((u) => UNIT_DEFS[u].name).join(', ')}
              </div>
            )}
          </div>
        )}

        {/* Upgrade panel */}
        {isVictory && (
          <div className="mt-4">
            <button
              onClick={() => setShowUpgrade((s) => !s)}
              className="w-full rounded-md border border-cyan-700/40 bg-cyan-950/30 py-2 text-xs font-bold uppercase tracking-widest text-cyan-300 hover:bg-cyan-900/30"
            >
              {showUpgrade ? 'Hide Upgrades' : `Upgrade Units (${liveSave.gold}g)`}
            </button>
            {showUpgrade && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {liveSave.roster.map((r) => {
                  const def = UNIT_DEFS[r.type];
                  const stats = leveledStats(def, r.level);
                  const maxed = r.level >= 3;
                  const cost = upgradeCost(r.level);
                  return (
                    <div
                      key={r.type}
                      className="rounded-md border border-white/10 bg-white/5 p-2.5"
                      style={{ borderLeft: `3px solid ${hexToCss(def.color)}` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-100">
                          {def.name}
                        </span>
                        <span
                          className="rounded px-1.5 text-[10px] font-black"
                          style={{
                            backgroundColor: hexToCss(def.color) + '33',
                            color: hexToCss(def.color),
                          }}
                        >
                          Lv{r.level}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500">
                        HP {stats.hp} &middot; DMG {stats.dmg}
                      </div>
                      <button
                        onClick={() => upgradeUnit(r.type)}
                        disabled={maxed || liveSave.gold < cost}
                        className="mt-2 w-full rounded bg-cyan-800/50 py-1 text-[10px] font-bold uppercase text-cyan-200 enabled:hover:bg-cyan-700/60 disabled:opacity-40"
                      >
                        {maxed ? 'Max Level' : `Upgrade ${cost}g`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onContinue}
          className={[
            'mt-6 w-full rounded-lg py-3 text-sm font-black uppercase tracking-[0.3em] text-white shadow-lg',
            isVictory
              ? 'bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500'
              : 'bg-gradient-to-r from-red-700 to-orange-700 hover:from-red-600 hover:to-orange-600',
          ].join(' ')}
        >
          {isVictory ? 'Continue' : 'Retry Briefing'}
        </button>
      </div>
    </div>
  );
};
