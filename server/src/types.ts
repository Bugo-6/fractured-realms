export type ArenaType =
  | 'desertTown'
  | 'coastalRuins'
  | 'industrial'
  | 'desertOpen'
  | 'underground'
  | 'crater';

export type UnitTypeId = string;

export interface DefenseSlot {
  type: UnitTypeId;
  count: number;
  level: 1 | 2 | 3;
}

export interface SavedBase {
  id: string;
  playerId: string;
  playerName: string;
  arena: ArenaType;
  defense: DefenseSlot[];
  rating: number;
  wins: number;
  losses: number;
  updatedAt: string;
}

export interface SpawnEvent {
  seq: number;
  fromSocketId: string;
  unitType: UnitTypeId;
  level: number;
  timestamp: number;
}

export interface RoomPlayer {
  socketId: string;
  playerId: string;
  playerName: string;
  side: 'left' | 'right';
}

export interface Room {
  id: string;
  arena: ArenaType;
  players: [RoomPlayer, RoomPlayer];
  state: 'active' | 'ended';
  spawnSeq: number;
}

export interface ServerToClientEvents {
  'room:joined': (roomId: string, side: 'left' | 'right', arena: ArenaType, opponentName: string) => void;
  'room:spawn': (event: SpawnEvent) => void;
  'room:end': (winner: 'left' | 'right') => void;
  'matchmaking:waiting': () => void;
  error: (msg: string) => void;
}

export interface ClientToServerEvents {
  'matchmaking:join': (playerId: string, playerName: string) => void;
  'matchmaking:cancel': () => void;
  'room:spawn': (unitType: UnitTypeId, level: number) => void;
  'room:end': (winner: 'left' | 'right') => void;
}
