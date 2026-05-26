import type { Room, RoomPlayer, ArenaType } from './types.js';

const ARENAS: ArenaType[] = ['desertTown', 'coastalRuins', 'industrial', 'desertOpen'];
const rooms = new Map<string, Room>();
const queue: RoomPlayer[] = [];

function uid(): string { return Math.random().toString(36).slice(2, 10); }

export function enqueue(p: RoomPlayer): Room | null {
  const waiting = queue.shift();
  if (!waiting) { queue.push(p); return null; }
  const room: Room = {
    id: uid(),
    arena: ARENAS[Math.floor(Math.random() * ARENAS.length)],
    players: [{ ...waiting, side: 'left' }, { ...p, side: 'right' }],
    state: 'active',
    spawnSeq: 0,
  };
  rooms.set(room.id, room);
  return room;
}

export function dequeue(socketId: string): void {
  const i = queue.findIndex(p => p.socketId === socketId);
  if (i !== -1) queue.splice(i, 1);
}

export function roomBySocket(socketId: string): Room | null {
  return [...rooms.values()].find(r => r.players.some(p => p.socketId === socketId)) ?? null;
}

export function nextSeq(roomId: string): number {
  const r = rooms.get(roomId);
  if (!r) return 0;
  return ++r.spawnSeq;
}

export function closeRoom(roomId: string): void {
  rooms.delete(roomId);
}
