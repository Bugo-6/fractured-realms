# Wasteland Command — Multiplayer Server

Node.js + Socket.io server handling real-time PvP and async base raiding.

## Setup

```bash
cd server
npm install
npm run dev        # development (tsx watch)
npm run build      # compile to dist/
npm start          # production
```

## Deploy (Railway / Render)

1. Point root to `server/`
2. Set `PORT` env var (default 3001)
3. Set `VITE_SERVER_URL` in the Vercel client to your server URL

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bases?exclude=<playerId>` | List enemy bases to raid |
| GET | `/api/bases/me/:playerId` | Get your saved base |
| POST | `/api/bases` | Save / update your defense base |
| POST | `/api/bases/:id/result` | Report raid outcome `{ attackerWon: bool }` |

## Socket events

**Client → Server**
- `matchmaking:join(playerId, playerName)` — enter queue
- `matchmaking:cancel` — leave queue
- `room:spawn(unitType, level)` — broadcast a unit deployment
- `room:end(winner)` — declare battle result

**Server → Client**
- `matchmaking:waiting` — still in queue
- `room:joined(roomId, side, arena, opponentName)` — match found
- `room:spawn(SpawnEvent)` — opponent deployed a unit
- `room:end(winner)` — battle over
