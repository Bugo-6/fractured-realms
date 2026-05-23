import React, { useEffect, useState } from 'react';
import { ENDING_LINES } from '../game/campaign';

interface EndingProps {
  onMainMenu: () => void;
}

export const Ending: React.FC<EndingProps> = ({ onMainMenu }) => {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= ENDING_LINES.length) return;
    const t = window.setTimeout(() => setRevealed((r) => r + 1), 1500);
    return () => window.clearTimeout(t);
  }, [revealed]);

  const done = revealed >= ENDING_LINES.length;

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#1a0a05] via-black to-black px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(255,140,40,0.25), transparent 60%)',
        }}
      />
      <div className="relative z-10 max-w-2xl text-center">
        {ENDING_LINES.slice(0, revealed).map((linext, i) => {
          const isTitle = linext === 'WASTELAND COMMAND';
          const isThanks = linext === 'Thank you for playing.';
          if (linext === '') return <div key={i} className="h-6" />;
          return (
            <p
              key={i}
              className={[
                'mb-4 animate-[fadeIn_1s_ease] leading-relaxed',
                isTitle
                  ? 'text-3xl font-black uppercase tracking-[0.3em] text-orange-400 sm:text-4xl'
                  : isThanks
                    ? 'text-sm uppercase tracking-widest text-gray-500'
                    : 'text-base text-gray-300 sm:text-lg',
              ].join(' ')}
              style={{ animationFillMode: 'both' }}
            >
              {linext}
            </p>
          );
        })}
      </div>

      {done && (
        <button
          onClick={onMainMenu}
          className="relative z-10 mt-8 rounded-lg bg-gradient-to-r from-orange-600 to-red-600 px-8 py-3 text-sm font-black uppercase tracking-[0.3em] text-white shadow-lg shadow-red-900/40 hover:from-orange-500 hover:to-red-500"
        >
          Main Menu
        </button>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
