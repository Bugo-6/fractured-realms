import type { SavedBase, DefenseSlot } from './types';
import type { ArenaType } from '../game/types';

const SERVER = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

// ── JWT helpers ───────────────────────────────────────────────────────────

let _token: string | null = localStorage.getItem('wc_jwt');

function getToken(): string | null { return _token; }

function setToken(t: string): void {
  _token = t;
  localStorage.setItem('wc_jwt', t);
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (t) base['Authorization'] = `Bearer ${t}`;
  return base;
}

export async function authPlayer(playerId: string): Promise<void> {
  const res = await fetch(`${SERVER}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId }),
  });
  const data = await res.json() as { token: string };
  setToken(data.token);
}

// ── Bases ─────────────────────────────────────────────────────────────────

export async function fetchBases(excludePlayerId: string): Promise<SavedBase[]> {
  const res = await fetch(`${SERVER}/api/bases?exclude=${excludePlayerId}`);
  return json<SavedBase[]>(res);
}

export async function fetchMyBase(playerId: string): Promise<SavedBase | null> {
  const res = await fetch(`${SERVER}/api/bases/me/${playerId}`);
  return json<SavedBase | null>(res);
}

export async function saveBase(
  _playerId: string,
  playerName: string,
  arena: ArenaType,
  defense: DefenseSlot[],
): Promise<SavedBase> {
  const res = await fetch(`${SERVER}/api/bases`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ playerName, arena, defense }),
  });
  return json<SavedBase>(res);
}

export async function startRaid(baseId: string): Promise<string> {
  const res = await fetch(`${SERVER}/api/bases/${baseId}/start-raid`, {
    method: 'POST',
    headers: authHeaders(),
    body: '{}',
  });
  const data = await res.json() as { battleToken: string };
  return data.battleToken;
}

export async function reportRaidResult(
  baseId: string,
  attackerWon: boolean,
  battleToken: string,
): Promise<void> {
  await fetch(`${SERVER}/api/bases/${baseId}/result`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ attackerWon, battleToken }),
  });
}
