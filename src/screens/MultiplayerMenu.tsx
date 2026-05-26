import React from 'react';

interface Props {
  onPvP: () => void;
  onEditBase: () => void;
  onRaid: () => void;
  onBack: () => void;
}

export const MultiplayerMenu: React.FC<Props> = ({ onPvP, onEditBase, onRaid, onBack }) => (
  <div className="flex h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0a0a1a] to-black px-6">
    <div className="text-center">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.4em] text-blue-400/70">Online</p>
      <h2 className="text-4xl font-black uppercase tracking-tight text-white">Multiplayer</h2>
      <p className="mt-2 text-sm text-gray-500">Challenge other commanders across the wasteland.</p>
    </div>

    <div className="flex w-full max-w-xs flex-col gap-3">
      <MpButton label="Real-Time PvP" desc="1v1 live battle — deploy units as they spawn" icon="⚔️" onClick={onPvP} color="blue" />
      <MpButton label="Edit My Base" desc="Set up a defense for others to raid" icon="🛡" onClick={onEditBase} color="green" />
      <MpButton label="Raid a Base" desc="Attack a human-designed defense" icon="💥" onClick={onRaid} color="orange" />
    </div>

    <button onClick={onBack} className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-300">
      ← Back
    </button>
  </div>
);

const MpButton: React.FC<{
  label: string; desc: string; icon: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'orange';
}> = ({ label, desc, icon, onClick, color }) => {
  const ring = {
    blue: 'border-blue-500/40 hover:border-blue-400 hover:bg-blue-950/40',
    green: 'border-green-500/40 hover:border-green-400 hover:bg-green-950/40',
    orange: 'border-orange-500/40 hover:border-orange-400 hover:bg-orange-950/40',
  }[color];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 rounded-lg border bg-black/40 px-4 py-3 text-left transition-colors ${ring}`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-sm font-bold text-white">{label}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </button>
  );
};
