import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { randomUUID } from 'crypto';
import type { ClientToServerEvents, ServerToClientEvents, SpawnEvent } from './types.js';
import * as db from './db.js';
import * as rooms from './rooms.js';

const app = express();
app.use(cors());
app.use(express.json());

const http = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(http, {
  cors: { origin: '*' },
});

db.loadDb();

// ── REST: Base raiding ────────────────────────────────────────────────────

app.get('/api/bases', (req, res) => {
  res.json(db.listBases(req.query.exclude as string | undefined));
});

app.get('/api/bases/me/:playerId', (req, res) => {
  res.json(db.getBaseByPlayer(req.params.playerId) ?? null);
});

app.post('/api/bases', (req, res) => {
  const { playerId, playerName, arena, defense } = req.body;
  if (!playerId || !Array.isArray(defense))
    return res.status(400).json({ error: 'Missing fields' });

  const existing = db.getBaseByPlayer(playerId as string);
  const base = {
    id: existing?.id ?? randomUUID(),
    playerId: playerId as string,
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

app.post('/api/bases/:id/result', (req, res) => {
  db.recordResult(req.params.id, !!req.body.attackerWon);
  res.json({ ok: true });
});

// ── Socket.io: Real-time PvP ──────────────────────────────────────────────

io.on('connection', socket => {
  let roomId: string | null = null;
  let mySide: 'left' | 'right' = 'left';

  socket.on('matchmaking:join', (playerId, playerName) => {
    const room = rooms.enqueue({
      socketId: socket.id,
      playerId,
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
