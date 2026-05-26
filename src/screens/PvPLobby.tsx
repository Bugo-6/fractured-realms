import React, { useEffect, useRef, useState } from 'react';
import type { ArenaType } from '../game/types';
import { connect, disconnect, getSocket } from '../multiplayer/socket';

interface Props {
  playerId: string;
  playerName: string;
  onMatchFound: (roomId: string, side: 'left' | 'right', arena: ArenaType, opponentName: string) => void;
  onBack: () => void;
}

type State = 'idle' | 'searching' | 'found';

export const PvPLobby: React.FC<Props> = ({ playerId, playerName, onMatchFound, onBack }) => {
  const [state, setState] = useState<State>('idle');
  const connectedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (connectedRef.current) {
        getSocket().emit('matchmaking:cancel');
        disconnect();
        connectedRef.current = false;
      }
    };
  }, []);

  const startSearch = () => {
    connect();
    connectedRef.current = true;
    const socket = getSocket();

    socket.once('matchmaking:waiting', () => setState('searching'));
    socket.once('room:joined', (roomId, side, arena, opponentName) => {
      setState('found');
      setTimeout(() => onMatchFound(roomId, side, arena, opponentName), 800);
    });

    socket.emit('matchmaking:join', playerId, playerName);
    setState('searching');
  };

  const cancel = () => {
    getSocket().emit('matchmaking:cancel');
    disconnect();
    connectedRef.current = false;
    setState('idle');
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-[#0a0a1a] text-white px-6">
      <div className="text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.4em] text-blue-400/70">1v1</p>
        <h2 className="text-4xl font-black uppercase tracking-tight">Real-Time PvP</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Both commanders deploy units live. Only spawn events sync — simulations run locally.
        </p>
      </div>

      {state === 'idle' && (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <button onClick={startSearch}
            className="w-full rounded-md bg-blue-700 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white hover:bg-blue-600 transition-colors">
            Find Match
          </button>
          <button onClick={onBack} className="text-xs uppercase tracking-widest text-gray-500 hover:text-gray-300">← Back</button>
        </div>
      )}

      {state === 'searching' && (
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Searching for opponent...</p>
          <button onClick={cancel} className="text-xs uppercase tracking-widest text-gray-600 hover:text-gray-300">Cancel</button>
        </div>
      )}

      {state === 'found' && (
        <div className="text-center">
          <div className="text-3xl font-black text-green-400">Match Found!</div>
          <p className="mt-2 text-sm text-gray-400">Entering battle...</p>
        </div>
      )}
    </div>
  );
};
