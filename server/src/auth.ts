import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET ?? 'wc-dev-secret-change-in-prod';

export function signPlayerToken(playerId: string): string {
  return jwt.sign({ sub: playerId }, SECRET, { expiresIn: '30d' });
}

export function verifyPlayerToken(token: string): string | null {
  try {
    const p = jwt.verify(token, SECRET) as { sub: string };
    return p.sub;
  } catch {
    return null;
  }
}

export function signBattleToken(baseId: string, attackerId: string): string {
  return jwt.sign({ baseId, attackerId, startedAt: Date.now() }, SECRET, { expiresIn: '10m' });
}

export function verifyBattleToken(
  token: string,
): { baseId: string; attackerId: string; startedAt: number } | null {
  try {
    return jwt.verify(token, SECRET) as { baseId: string; attackerId: string; startedAt: number };
  } catch {
    return null;
  }
}
