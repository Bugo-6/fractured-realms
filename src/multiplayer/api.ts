import type { SavedBase, DefenseSlot } from './types';
import type { ArenaType } from '../game/types';

const SERVER = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function fetchBases(excludePlayerId: string): Promise<SavedBase[]> {
  const res = await fetch(`${SERVER}/api/bases?exclude=${excludePlayerId}`);
  return json<SavedBase[]>(res);
}

export async function fetchMyBase(playerId: string): Promise<SavedBase | null> {
  const res = await fetch(`${SERVER}/api/bases/me/${playerId}`);
  return json<SavedBase | null>(res);
}

export async function saveBase(
  playerId: string,
  playerName: string,
  arena: ArenaType,
  defense: DefenseSlot[],
): Promise<SavedBase> {
  const res = await fetch(`${SERVER}/api/bases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId, playerName, arena, defense }),
  });
  return json<SavedBase>(res);
}

export async function reportRaidResult(baseId: string, attackerWon: boolean): Promise<void> {
  await fetch(`${SERVER}/api/bases/${baseId}/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attackerWon }),
  });
}
