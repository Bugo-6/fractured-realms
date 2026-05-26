import React, { useEffect, useState } from 'react';
import type { SavedBase } from '../multiplayer/types';
import { fetchBases, startRaid } from '../multiplayer/api';

interface Props {
  playerId: string;
  onRaid: (base: SavedBase, battleToken: string) => void;
  onBack: () => void;
}

export const RaidLobby: React.FC<Props> = ({ playerId, onRaid, onBack }) => {
  const [bases, setBases] = useState<SavedBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raiding, setRaiding] = useState<string | null>(null);

  useEffect(() => {
    fetchBases(playerId)
      .then(setBases)
      .catch(() => setError('Cannot reach server. Set VITE_SERVER_URL in .env.local'))
      .finally(() => setLoading(false));
  }, [playerId]);

  const handleRaid = async (base: SavedBase) => {
    setRaiding(base.id);
    try {
      const battleToken = await startRaid(base.id);
      onRaid(base, battleToken);
    } catch {
      setError('Failed to start raid. Try again.');
    } finally {
      setRaiding(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#0a0a14] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <button onClick={onBack} className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-200">← Back</button>
        <h2 className="text-sm font-black uppercase tracking-[0.3em] text-orange-400">Raid Lobby</h2>
        <div />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && <div className="text-center text-gray-500 py-10">Loading bases...</div>}
        {error && <div className="text-center text-red-400 py-10">{error}</div>}
        {!loading && !error && bases.length === 0 && (
          <div className="text-center text-gray-500 py-10">No bases yet. Be the first to build one!</div>
        )}
        <div className="flex flex-col gap-3">
          {bases.map(base => (
            <div key={base.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <div>
                <div className="font-bold text-sm">{base.playerName}</div>
                <div className="text-xs text-gray-400">
                  {base.arena} · ★ {base.rating} · {base.defense.reduce((s, d) => s + d.count, 0)} units
                </div>
                <div className="text-xs text-gray-600">W {base.wins} / L {base.losses}</div>
              </div>
              <button
                onClick={() => handleRaid(base)}
                disabled={raiding === base.id}
                className="rounded-md bg-orange-700 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white hover:bg-orange-600 transition-colors disabled:opacity-50">
                {raiding === base.id ? '...' : 'Raid'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
