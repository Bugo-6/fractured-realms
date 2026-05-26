import { io, type Socket } from 'socket.io-client';
import type { ArenaType, UnitTypeId } from '../game/types';
import type { SpawnEvent } from './types';

const SERVER = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

interface ServerToClientEvents {
  'room:joined': (roomId: string, side: 'left' | 'right', arena: ArenaType, opponentName: string) => void;
  'room:spawn': (event: SpawnEvent) => void;
  'room:end': (winner: 'left' | 'right') => void;
  'matchmaking:waiting': () => void;
  error: (msg: string) => void;
}

interface ClientToServerEvents {
  'matchmaking:join': (playerId: string, playerName: string) => void;
  'matchmaking:cancel': () => void;
  'room:spawn': (unitType: UnitTypeId, level: number) => void;
  'room:end': (winner: 'left' | 'right') => void;
}

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let _socket: GameSocket | null = null;

export function getSocket(): GameSocket {
  if (!_socket) {
    _socket = io(SERVER, { autoConnect: false });
  }
  return _socket;
}

export function connect(): void {
  getSocket().connect();
}

export function disconnect(): void {
  _socket?.disconnect();
  _socket = null;
}
