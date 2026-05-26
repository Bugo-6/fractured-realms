import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { SavedBase } from './types.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(dir, '../../data/bases.json');

let store = new Map<string, SavedBase>();

export function loadDb(): void {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const list = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as SavedBase[];
      store = new Map(list.map(b => [b.id, b]));
      console.log(`Loaded ${store.size} bases.`);
    }
  } catch (e) {
    console.error('DB load error:', e);
  }
}

function flush(): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify([...store.values()], null, 2));
  } catch { /* ignore */ }
}

export function upsertBase(b: SavedBase): void {
  store.set(b.id, b);
  flush();
}

export function getBaseByPlayer(playerId: string): SavedBase | null {
  return [...store.values()].find(b => b.playerId === playerId) ?? null;
}

export function getBaseById(id: string): SavedBase | null {
  return store.get(id) ?? null;
}

export function listBases(excludePlayerId?: string, limit = 20): SavedBase[] {
  return [...store.values()]
    .filter(b => !excludePlayerId || b.playerId !== excludePlayerId)
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

export function recordResult(baseId: string, attackerWon: boolean): void {
  const b = store.get(baseId);
  if (!b) return;
  if (attackerWon) { b.losses++; b.rating = Math.max(0, b.rating - 25); }
  else             { b.wins++;   b.rating += 15; }
  b.updatedAt = new Date().toISOString();
  flush();
}
