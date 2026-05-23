import React from 'react';
import { CHAPTERS } from '../game/campaign';

interface Props {
  completedChapters: number[];
  currentChapter: number;
  gold: number;
  onSelectChapter: (id: number) => void;
  onMenu: () => void;
}

const TERRAIN_ICONS: Record<string, string> = {
  hills: '🌿', desert: '🏜', industrial: '⚙️', wasteland: '💀', ruins: '🗺', void: '🌌',
};

export function CampaignMap({ completedChapters, currentChapter, gold, onSelectChapter, onMenu }: Props) {
  return (
    <div className="min-h-screen bg-[#07050f] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button onClick={onMenu} className="text-gray-400 hover:text-white font-mono text-sm transition-colors">
          ← Menu
        </button>
        <h2 className="font-black text-xl uppercase tracking-widest text-purple-300 font-mono">
          Campaign Map
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="text-amber-400 text-lg">◆</span>
          <span className="font-mono font-bold text-amber-300">{gold}</span>
          <span className="text-gray-500 text-xs font-mono">gold</span>
        </div>
      </div>

      {/* Chapter list */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4 py-10 max-w-2xl mx-auto w-full">
        {CHAPTERS.map((chapter, idx) => {
          const done = completedChapters.includes(chapter.id);
          const isNext = chapter.id === currentChapter;
          const locked = chapter.id > currentChapter;

          return (
            <React.Fragment key={chapter.id}>
              {/* Connector line */}
              {idx > 0 && (
                <div className={`w-0.5 h-6 ${done ? 'bg-green-500' : 'bg-white/10'}`} />
              )}

              <button
                disabled={locked}
                onClick={() => onSelectChapter(chapter.id)}
                className={`w-full rounded-xl border px-6 py-4 flex items-center gap-4 transition-all
                  ${locked
                    ? 'opacity-40 cursor-not-allowed border-white/10 bg-white/5'
                    : done
                    ? 'border-green-500/40 bg-green-900/20 hover:bg-green-900/30 cursor-pointer'
                    : isNext
                    ? 'border-amber-400/60 bg-amber-900/20 hover:bg-amber-900/30 cursor-pointer ring-1 ring-amber-400/30'
                    : 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer'
                  }`}
              >
                {/* Chapter icon */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0
                  ${done ? 'bg-green-500/20 border border-green-500/50'
                    : isNext ? 'bg-amber-400/20 border border-amber-400/50'
                    : 'bg-white/5 border border-white/10'}`}>
                  {locked ? '🔒' : done ? '✅' : TERRAIN_ICONS[chapter.terrain]}
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{chapter.subtitle}</span>
                    {isNext && <span className="text-xs font-mono text-amber-400 border border-amber-400/40 px-1.5 rounded">CURRENT</span>}
                    {done && <span className="text-xs font-mono text-green-400">COMPLETED</span>}
                  </div>
                  <div className="font-bold text-lg">{chapter.title}</div>
                  <div className="text-sm text-gray-400 font-mono">vs. {chapter.enemyLabel}</div>
                </div>

                {/* Reward */}
                {!done && !locked && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-500 font-mono">reward</div>
                    <div className="text-amber-400 font-bold font-mono">◆ {chapter.reward}</div>
                  </div>
                )}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
