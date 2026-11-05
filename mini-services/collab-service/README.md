# collab-service

A standalone Bun + Socket.io real-time collaboration mini-service for the Live Technical Interview & AI Assessment Platform. It runs on port `3003` and exposes the path `/` with permissive CORS so the Caddy gateway can route browser traffic that connects via `io('/?XTransformPort=3003', { transports: ['websocket','polling'] })`. Each interview room is identified by a `roomCode` and supports presence (join-room, presence:update, disconnect), live code sync (code:change, language:change, cursor:move), chat (chat:message), whiteboard collaboration (whiteboard:draw / clear / sync-request / state), proctoring violation forwarding (proctoring:violation), in-memory code snapshots for replay (snapshot:save / saved / request / list), and WebRTC signaling relay (webrtc:offer / answer / ice-candidate) targeted by `userId`. State is kept in-memory (participants map, snapshots capped at 200 per room) and the service shuts down gracefully on SIGTERM/SIGINT.

## Events handled

| Event | Direction | Notes |
| --- | --- | --- |
| `join-room` | client → server | Join `room:<roomCode>`, store presence, broadcast `presence:update` |
| `presence:update` | server → room | Participant list (also on disconnect) |
| `code:change` | client → others | Broadcast to others in the room (sender excluded) |
| `language:change` | client → others | Broadcast to others |
| `cursor:move` | client → others | Live collaborator cursor badges |
| `chat:message` | client → room | Broadcast to everyone in the room |
| `whiteboard:draw` | client → others | Relay drawing strokes |
| `whiteboard:clear` | client → others | Clear canvas |
| `whiteboard:sync-request` | client → others | Ask room for current canvas |
| `whiteboard:state` | client → room | Broadcast current canvas to room |
| `proctoring:violation` | client → room | Forward violations (tab-switch, window-blur, paste-anomaly, fullscreen-exit) |
| `snapshot:save` | client → room | Store snapshot (max 200/room), emit `snapshot:saved` with count |
| `snapshot:saved` | server → room | Snapshot count update |
| `snapshot:request` | client → server | Request list of snapshots |
| `snapshot:list` | server → requester | Returns array of `{ code, language, eventType, timestamp }` |
| `webrtc:offer` | client → server | Relay to target userId (silent drop if missing) |
| `webrtc:answer` | client → server | Relay to target userId |
| `webrtc:ice-candidate` | client → server | Relay to target userId |
| `server:shutdown` | server → all | Emitted during graceful shutdown |

## Scripts

```bash
bun install
bun run dev   # bun --hot index.ts  (auto-restart on file change)
bun run start # bun index.ts
```
