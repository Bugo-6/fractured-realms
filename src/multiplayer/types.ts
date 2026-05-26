import type { ArenaType, UnitTypeId } from '../game/types';

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
