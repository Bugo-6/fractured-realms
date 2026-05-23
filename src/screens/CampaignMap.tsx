import React from 'react';
import type { SaveState } from '../game/types';
import { CAMPAIGN } from '../game/campaign';
import { ARENA_NAMES } from '../game/arenaBuilder';

interface CampaignMapProps {
  save: SaveState;
  onSelectChapter: (id: number) => void;
  onMenu: () => void;
}

export const CampaignMap: React.FC<CampaignMapProps> = ({
  save,
  onSelectChapter,
  onMenu,
}) => {
  const isCompleted = (id: number) => save.completedChapters.includes(id);
  const isUnlocked = (id: number) =>
    id === 0 || save.completedChapters.includes(id - 1) || isCompleted(id);

  return (
    <div className="relative h-full w-full overflow-y-auto bg-gradient-to-b from-[#15100c] via-[#0a0806] to-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,160,80,0.06) 0 1px, transparent 1px 60px), repeating-linear-gradient(0deg, rgba(255,160,80,0.06) 0 1px, transparent 1px 60px)',
        }}
      />
      {/* Top bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-orange-900/40 bg-black/70 px-5 py-3 backdrop-blur">
        <button
          onClick={onMenu}
          className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-orange-300"
        >
          &larr; Menu
        </button>
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-orange-200">
          Campaign
        </h2>
        <div className="rounded-md border border-amber-500/40 bg-amber-950/40 px-3 py-1 text-sm font-bold text-amber-300">
          {save.gold} <span className="text-[10px] text-amber-500/70">GOLD</span>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-5 py-8">
        <div className="relative flex flex-col gap-5">
          {/* vertical path line */}
          <div className="absolute left-[28px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-orange-700/60 via-red-800/40 to-transparent" />
          {CAMPAIGN.map((c) => {
            const unlocked = isUnlocked(c.id);
            const completed = isCompleted(c.id);
            const current = unlocked && !completed;
            return (
              <button
                key={c.id}
                disabled={!unlocked}
                onClick={() => unlocked && onSelectChapter(c.id)}
                className={[
                  'relative flex items-center gap-4 rounded-lg border px-4 py-4 text-left transition-all',
                  unlocked
                    ? 'cursor-pointer border-orange-700/40 bg-gradient-to-r from-[#1c1410] to-[#120c08] hover:border-orange-500 hover:from-[#241812]'
                    : 'cursor-not-allowed border-white/5 bg-black/40 opacity-50',
                ].join(' ')}
              >
                <div
                  className={[
                    'z-10 flex h-14 w-14 flex-none items-center justify-center rounded-full border-2 text-lg font-black',
                    completed
                      ? 'border-green-500 bg-green-900/40 text-green-300'
                      : current
                        ? 'border-orange-400 bg-orange-900/40 text-orange-200 shadow-lg shadow-orange-900/50'
                        : 'border-gray-700 bg-gray-900 text-gray-500',
                  ].join(' ')}
                >
                  {completed ? '✓' : unlocked ? c.id + 1 : '\u{1F512}'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/70">
                      Chapter {c.id + 1}
                    </span>
                    {current && (
                      <span className="rounded bg-orange-600/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-300">
                        Next
                      </span>
                    )}
                  </div>
                  <h3 className="truncate text-lg font-bold text-gray-100">
                    {c.title}
                  </h3>
                  <p className="truncate text-xs text-gray-500">
                    {ARENA_NAMES[c.arena]} &middot; Reward {c.reward}g
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
