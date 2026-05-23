import React, { useEffect, useState } from 'react';
import { Chapter, UnitClassId } from '../game/types';
import { UNIT_DEFS } from '../game/unitDefs';

interface Props {
  result: 'victory' | 'defeat';
  chapter: Chapter;
  goldEarned: number;
  newUnlocks: UnitClassId[];
  onContinue: () => void;
  isLastChapter: boolean;
}

export function PostBattle({ result, chapter, goldEarned, newUnlocks, onContinue, isLastChapter }: Props) {
  const [textIdx, setTextIdx] = useState(0);
  const story = result === 'victory' ? chapter.postStoryWin : chapter.postStoryLose;

  useEffect(() => {
    setTextIdx(0);
    const interval = setInterval(() => {
      setTextIdx(i => {
        if (i >= story.length) { clearInterval(interval); return i; }
        return i + 1;
      });
    }, 18);
    return () => clearInterval(interval);
  }, [story]);

  const isVictory = result === 'victory';

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6
      ${isVictory ? 'bg-[#03100a]' : 'bg-[#100305]'}`}
    >
      {/* Result banner */}
      <div className="text-center mb-10">
        <p className="text-sm font-mono tracking-widest text-gray-500 uppercase mb-1">{chapter.subtitle} — {chapter.title}</p>
        <h1
          className={`font-black uppercase text-6xl md:text-8xl`}
          style={{
            color: isVictory ? '#4ade80' : '#f87171',
            textShadow: `0 0 40px ${isVictory ? '#4ade80' : '#f87171'}`,
          }}
        >
          {isVictory ? 'VICTORY' : 'DEFEAT'}
        </h1>
      </div>

      {/* Story text */}
      <div className="max-w-xl text-center mb-8">
        <p className="text-gray-200 text-lg leading-relaxed font-serif">
          {story.slice(0, textIdx)}
          {textIdx < story.length && <span className="animate-pulse text-gray-400">█</span>}
        </p>
      </div>

      {/* Rewards (victory only) */}
      {isVictory && (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {goldEarned > 0 && (
            <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-600/40 px-4 py-2 rounded-lg">
              <span className="text-amber-400 text-xl">◆</span>
              <span className="font-mono font-bold text-amber-300">+{goldEarned} Gold</span>
            </div>
          )}
          {newUnlocks.map(id => (
            <div
              key={id}
              className="flex items-center gap-2 bg-blue-900/30 border border-blue-600/40 px-4 py-2 rounded-lg"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-sm"
                style={{ background: `${UNIT_DEFS[id].color}22`, border: `1.5px solid ${UNIT_DEFS[id].color}` }}
              >
                {UNIT_DEFS[id].letter}
              </div>
              <span className="font-mono text-sm text-blue-300">
                Unlocked: {UNIT_DEFS[id].name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={() => {
          if (textIdx < story.length) {
            setTextIdx(story.length); // skip to end
          } else {
            onContinue();
          }
        }}
        className={`px-10 py-4 rounded-xl font-bold font-mono uppercase tracking-wider text-lg transition-all hover:scale-105
          ${isVictory
            ? isLastChapter
              ? 'bg-purple-600 hover:bg-purple-500 text-white border border-purple-400'
              : 'bg-green-600 hover:bg-green-500 text-white border border-green-400'
            : 'bg-red-800 hover:bg-red-700 text-white border border-red-600'
          }`}
      >
        {textIdx < story.length
          ? 'Skip ▶'
          : isVictory
          ? isLastChapter ? '★ See Ending' : 'Continue →'
          : 'Try Again'}
      </button>
    </div>
  );
}
