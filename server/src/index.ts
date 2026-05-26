import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { randomUUID } from 'crypto';
import type { ClientToServerEvents, ServerToClientEvents, SpawnEvent } from './types.js';
import * as db from './db.js';
import * as rooms from './rooms.js';
import { signPlayerToken, verifyPlayerToken, signBattleToken, verifyBattleToken } from './auth.js';

const app = express();
app.use(cors());
app.use(express.json());

const http = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(http, {
  cors: { origin: '*' },
});

db.loadDb();

// ── Auth middleware ───────────────────────────────────────────────────────

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const playerId = verifyPlayerToken(token);
  if (!playerId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  (req as any).playerId = playerId;
  next();
}

// ── REST: Auth ────────────────────────────────────────────────────────────

app.post('/api/auth', (req, res) => {
  const { playerId } = req.body;
  if (!playerId || typeof playerId !== 'string' || playerId.length < 4)
    return res.status(400).json({ error: 'Invalid playerId' });
  const token = signPlayerToken(playerId);
  res.json({ token });
});

// ── REST: Bases ───────────────────────────────────────────────────────────

app.get('/api/bases', (req, res) => {
  res.json(db.listBases(req.query.exclude as string | undefined));
});

app.get('/api/bases/me/:playerId', (req, res) => {
  res.json(db.getBaseByPlayer(req.params.playerId) ?? null);
});

app.post('/api/bases', requireAuth, (req: any, res) => {
  const { playerName, arena, defense } = req.body;
  const playerId: string = req.playerId;
  if (!Array.isArray(defense))
    return res.status(400).json({ error: 'Missing fields' });

  const existing = db.getBaseByPlayer(playerId);
  const base = {
    id: existing?.id ?? randomUUID(),
    playerId,
    playerName: (playerName as string) ?? 'Commander',
    arena: (arena as string) ?? 'desertTown',
    defense,
    rating: existing?.rating ?? 1000,
    wins: existing?.wins ?? 0,
    losses: existing?.losses ?? 0,
    updatedAt: new Date().toISOString(),
  };
  db.upsertBase(base as any);
  res.json(base);
});

app.post('/api/bases/:id/start-raid', requireAuth, (req: any, res) => {
  const base = db.getBaseById(req.params.id);
  if (!base) return res.status(404).json({ error: 'Base not found' });
  if (base.playerId === req.playerId)
    return res.status(400).json({ error: 'Cannot raid your own base' });
  const battleToken = signBattleToken(base.id, req.playerId);
  res.json({ battleToken });
});

app.post('/api/bases/:id/result', requireAuth, (req: any, res) => {
  const { battleToken, attackerWon } = req.body;
  const claim = verifyBattleToken(battleToken);
  if (!claim) return res.status(400).json({ error: 'Invalid battle token' });
  if (claim.baseId !== req.params.id)
    return res.status(400).json({ error: 'Token mismatch' });
  if (claim.attackerId !== req.playerId)
    return res.status(403).json({ error: 'Not your battle' });
  if (Date.now() - claim.startedAt < 15_000)
    return res.status(400).json({ error: 'Battle ended too quickly' });

  db.recordResult(req.params.id, !!attackerWon);
  res.json({ ok: true });
});

// ── Socket.io: Real-time PvP ──────────────────────────────────────────────

// Per-socket spawn rate limiting: max 3 spawns per 2 seconds
const spawnTimestamps = new Map<string, number[]>();

function allowSpawn(socketId: string): boolean {
  const now = Date.now();
  const window = 2000;
  const maxSpawns = 3;
  const ts = (spawnTimestamps.get(socketId) ?? []).filter(t => now - t < window);
  if (ts.length >= maxSpawns) return false;
  ts.push(now);
  spawnTimestamps.set(socketId, ts);
  return true;
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Authentication required'));
  const playerId = verifyPlayerToken(token);
  if (!playerId) return next(new Error('Invalid token'));
  (socket as any).playerId = playerId;
  next();
});

io.on('connection', socket => {
  let roomId: string | null = null;
  let mySide: 'left' | 'right' = 'left';

  socket.on('matchmaking:join', (_playerId, playerName) => {
    const verifiedPlayerId = (socket as any).playerId as string;
    const room = rooms.enqueue({
      socketId: socket.id,
      playerId: verifiedPlayerId,
      playerName,
      side: 'left',
    });

    if (!room) {
      socket.emit('matchmaking:waiting');
      return;
    }

    roomId = room.id;
    const [p1, p2] = room.players;
    mySide = p1.socketId === socket.id ? 'left' : 'right';

    const s1 = io.sockets.sockets.get(p1.socketId);
    const s2 = io.sockets.sockets.get(p2.socketId);
    s1?.join(room.id);
    s2?.join(room.id);
    s1?.emit('room:joined', room.id, 'left', room.arena, p2.playerName);
    s2?.emit('room:joined', room.id, 'right', room.arena, p1.playerName);
  });

  socket.on('matchmaking:cancel', () => rooms.dequeue(socket.id));

  socket.on('room:spawn', (unitType, level) => {
    if (!roomId) return;
    if (!allowSpawn(socket.id)) return;
    const event: SpawnEvent = {
      seq: rooms.nextSeq(roomId),
      fromSocketId: socket.id,
      unitType,
      level,
      timestamp: Date.now(),
    };
    io.to(roomId).emit('room:spawn', event);
  });

  socket.on('room:end', winner => {
    if (!roomId) return;
    io.to(roomId).emit('room:end', winner);
    rooms.closeRoom(roomId);
    roomId = null;
  });

  socket.on('disconnect', () => {
    spawnTimestamps.delete(socket.id);
    rooms.dequeue(socket.id);
    if (roomId) {
      io.to(roomId).emit('room:end', mySide === 'left' ? 'right' : 'left');
      rooms.closeRoom(roomId);
      roomId = null;
    }
  });
});

const PORT = Number(process.env.PORT ?? 3001);
http.listen(PORT, () => console.log(`Wasteland Command server on :${PORT}`));
