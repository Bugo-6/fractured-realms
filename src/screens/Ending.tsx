import React, { useEffect, useState } from 'react';

interface Props {
  onMainMenu: () => void;
}

const LINES = [
  'The Void Gate collapses.',
  'Reality knits itself back together, one shard at a time.',
  'From the hills of Aldor to the wastelands of the last world...',
  '...silence.',
  'The knights sheathe their swords.',
  'The legionaries lower their shields.',
  'The machines stand down.',
  'The survivors breathe.',
  '',
  'You did it, Commander.',
  'The fractured realms are whole.',
  '',
  '★  FRACTURED REALMS — THE END  ★',
];

export function Ending({ onMainMenu }: Props) {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setVisibleLines(v => {
        if (v >= LINES.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#02000a] flex flex-col items-center justify-center p-10 text-center">
      <div className="max-w-lg space-y-4">
        {LINES.slice(0, visibleLines).map((line, i) => (
          <p
            key={i}
            className={`transition-opacity duration-700
              ${line === '' ? 'h-4' : ''}
              ${line.startsWith('★') ? 'text-2xl font-black text-purple-300 mt-8' : 'text-gray-300 text-lg font-serif'}`}
          >
            {line}
          </p>
        ))}
      </div>

      {visibleLines >= LINES.length && (
        <button
          onClick={onMainMenu}
          className="mt-12 px-10 py-3 rounded-xl font-bold font-mono uppercase tracking-wider text-white bg-purple-800 hover:bg-purple-700 border border-purple-500 transition-all hover:scale-105"
        >
          Return to Menu
        </button>
      )}
    </div>
  );
}
