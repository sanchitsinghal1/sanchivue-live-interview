// src/sockets/socketManager.js
// Socket.io server with authentication, per-room authorization, presence,
// code/cursor sync, chat, whiteboard, proctoring, snapshots, and WebRTC relay.
//
// Auth model:
//   Client connects with `io({ auth: { token } })` where `token` is the access
//   JWT. We verify it and store the user on `socket.data.user`.
//
// Authorization:
//   `join-room` payload must include `{ roomCode, interviewId }`. We look up the
//   Interview and confirm the user is a participant before joining the room.
//
// Persistence:
//   Proctoring / chat / snapshot events are throttled (1s) and persisted to the
//   Interview document via findOneAndUpdate $push with $slice caps.
import { Server } from 'socket.io';
import { verifyAccessToken } from '../services/token.service.js';
import User from '../models/user.model.js';
import Interview from '../models/interview.model.js';
import { corsOptions } from '../config/corsOptions.js';
import {
  SOCKET_PRESENCE_MAX,
  SOCKET_SNAPSHOT_MAX,
  SOCKET_THROTTLE_MS,
  APP_NAME,
} from '../config/constants.js';
import { getDbState } from '../db/index.js';

// In-memory maps. For multi-instance deployment swap with Redis adapter.
const presenceByRoom = new Map(); // roomCode → Map<userId, {socketId, user, joinedAt}>
const userSocketByUserId = new Map(); // userId → Set<socketId>
const snapshotsByRoom = new Map(); // roomCode → [{code, language, eventType, timestamp}]
// Throttle map: `${roomCode}:${kind}` → lastPersistedAt
const lastPersist = new Map();

// The single io instance — set by initSocketManager.
let io = null;

export function initSocketManager(httpServer) {
  io = new Server(httpServer, {
    // We deliberately use the default Socket.io path (`/socket.io/`) so it does
    // NOT collide with the Express routes (`/health`, `/api/v1/*`) that live on
    // the same HTTP server. The spec mentioned path `/` but that only works when
    // Socket.io has the HTTP server to itself (as in the collab mini-service on
    // port 3003). For an integrated Express backend we MUST keep them separate.
    path: '/socket.io/',
    cors: corsOptions,
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6, // 1MB cap on each event payload
  });

  // -- Auth middleware ------------------------------------------------------
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication required.'));
      }
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch {
        return next(new Error('Invalid or expired token.'));
      }
      if (getDbState() !== 'connected') {
        return next(new Error('Database unavailable. Retry shortly.'));
      }
      const user = await User.findById(decoded.sub).select('-password -refreshTokenHash');
      if (!user) return next(new Error('Account not found.'));
      if (user.isSuspended) return next(new Error('Account suspended.'));
      socket.data.user = user;
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error(String(err)));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    if (!user) {
      // Belt-and-braces: if no user somehow slipped past auth, drop it.
      socket.disconnect(true);
      return;
    }
    // Track sockets per user for WebRTC relay.
    if (!userSocketByUserId.has(String(user._id))) {
      userSocketByUserId.set(String(user._id), new Set());
    }
    userSocketByUserId.get(String(user._id)).add(socket.id);

    socket.on('join-room', async (payload, ack) => {
      try {
        const { roomCode, interviewId } = payload || {};
        if (!roomCode) {
          if (typeof ack === 'function') ack({ ok: false, error: 'roomCode required' });
          return;
        }
        if (getDbState() !== 'connected') {
          if (typeof ack === 'function') ack({ ok: false, error: 'Database unavailable' });
          return;
        }
        const interview = await Interview.findOne({ roomCode }).lean();
        if (!interview) {
          if (typeof ack === 'function') ack({ ok: false, error: 'Room not found' });
          return;
        }
        // Authorization: only participants may join.
        const isInterviewer = interview.interviewerIds?.some(
          (id) => String(id) === String(user._id),
        );
        const isCandidate =
          interview.candidateUserId && String(interview.candidateUserId) === String(user._id);
        const isPlatformAdmin = user.role === 'admin';
        if (!isInterviewer && !isCandidate && !isPlatformAdmin) {
          if (typeof ack === 'function')
            ack({ ok: false, error: 'Not a participant of this interview' });
          return;
        }
        // Leave any previous room for this socket so we never double-broadcast.
        for (const r of socket.rooms) {
          if (r !== socket.id) socket.leave(r);
        }
        const roomKey = `room:${roomCode}`;
        socket.join(roomKey);
        socket.data.roomCode = roomCode;
        socket.data.interviewId = interviewId || interview._id;

        // Update presence map.
        if (!presenceByRoom.has(roomCode)) presenceByRoom.set(roomCode, new Map());
        const roomPresence = presenceByRoom.get(roomCode);
        roomPresence.set(String(user._id), {
          socketId: socket.id,
          user: { _id: user._id, name: user.name, role: user.role, avatarUrl: user.avatarUrl },
          joinedAt: new Date(),
        });
        // Cap presence to SOCKET_PRESENCE_MAX — drop oldest. Rare in practice.
        if (roomPresence.size > SOCKET_PRESENCE_MAX) {
          const oldest = [...roomPresence.entries()].sort(
            (a, b) => a[1].joinedAt - b[1].joinedAt,
          )[0];
          if (oldest) roomPresence.delete(oldest[0]);
        }
        // Emit presence to everyone in the room.
        io.to(roomKey).emit('presence:update', Array.from(roomPresence.values()));
        // Send the last few snapshots so the new joiner can hydrate state.
        const snapshots = snapshotsByRoom.get(roomCode) || [];
        socket.emit('snapshot:list', snapshots.slice(-50));
        if (typeof ack === 'function')
          ack({ ok: true, interview: { _id: interview._id, status: interview.status } });
      } catch (err) {
        if (typeof ack === 'function') ack({ ok: false, error: err.message });
      }
    });

    // -- Code / language / cursor sync (broadcast to others in room) --------
    const relayToRoom = (event) => (payload) => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      socket
        .to(`room:${roomCode}`)
        .emit(event, { ...payload, userId: String(user._id), name: user.name });
    };
    socket.on('code:change', relayToRoom('code:change'));
    socket.on('language:change', relayToRoom('language:change'));
    socket.on('cursor:move', relayToRoom('cursor:move'));

    // -- Chat — broadcast to everyone in the room, persist throttled --------
    socket.on('chat:message', async (payload) => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      const message = {
        userId: user._id,
        name: payload?.name || user.name,
        role: user.role,
        body: String(payload?.body || '').slice(0, 2000),
        timestamp: new Date(),
      };
      io.to(`room:${roomCode}`).emit('chat:message', message);
      await persistRoomEvent(roomCode, 'chat', async (interviewId) => {
        await Interview.updateOne(
          { _id: interviewId },
          { $push: { chatLog: { $each: [message], $slice: -500 } } },
        );
      });
    });

    // -- Whiteboard relay (draw / clear / sync-request / state) -------------
    socket.on('whiteboard:draw', relayToRoom('whiteboard:draw'));
    socket.on('whiteboard:clear', () => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      socket.to(`room:${roomCode}`).emit('whiteboard:clear');
    });
    // When a new joiner asks for state, relay to others so someone replies.
    socket.on('whiteboard:sync-request', () => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      socket.to(`room:${roomCode}`).emit('whiteboard:sync-request', { userId: String(user._id) });
    });
    // State broadcast goes to everyone (the requester included).
    socket.on('whiteboard:state', (payload) => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      io.to(`room:${roomCode}`).emit('whiteboard:state', payload);
    });

    // -- Proctoring ----------------------------------------------------------
    socket.on('proctoring:violation', async (payload) => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      const entry = {
        type: payload?.type,
        severity: payload?.severity || 'low',
        detail: String(payload?.detail || '').slice(0, 500),
        timestamp: new Date(),
        userId: user._id,
      };
      // Broadcast to interviewers in the room only — candidates should NOT see
      // each other's proctoring alerts (in case of multi-candidate scenarios).
      io.to(`room:${roomCode}`).emit('proctoring:violation', entry);
      await persistRoomEvent(roomCode, 'proctoring', async (interviewId) => {
        await Interview.updateOne(
          { _id: interviewId },
          { $push: { proctoringLogs: { $each: [entry], $slice: -1000 } } },
        );
      });
    });

    // -- Snapshots -----------------------------------------------------------
    socket.on('snapshot:save', async (payload, ack) => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      const entry = {
        code: String(payload?.code || '').slice(0, 200000),
        language: payload?.language || 'javascript',
        eventType: payload?.eventType || 'auto',
        timestamp: new Date(),
      };
      if (!snapshotsByRoom.has(roomCode)) snapshotsByRoom.set(roomCode, []);
      const arr = snapshotsByRoom.get(roomCode);
      arr.push(entry);
      if (arr.length > SOCKET_SNAPSHOT_MAX) arr.splice(0, arr.length - SOCKET_SNAPSHOT_MAX);
      // Notify room of the new count.
      io.to(`room:${roomCode}`).emit('snapshot:saved', { count: arr.length });
      if (typeof ack === 'function') ack({ ok: true, count: arr.length });
      await persistRoomEvent(roomCode, 'snapshot', async (interviewId) => {
        await Interview.updateOne(
          { _id: interviewId },
          { $push: { snapshots: { $each: [entry], $slice: -300 } } },
        );
      });
    });
    // On request, reply only to the requester with the in-memory list.
    socket.on('snapshot:request', () => {
      const roomCode = socket.data.roomCode;
      if (!roomCode) return;
      const arr = snapshotsByRoom.get(roomCode) || [];
      socket.emit('snapshot:list', arr.slice(-50));
    });

    // -- WebRTC signaling relay (offer / answer / ice-candidate) -----------
    // Each event targets a specific `to` userId. We look up that user's sockets
    // and emit. If they aren't online we silently drop (no crash).
    const relayWebRTC = (event) => (payload) => {
      const toUserId = payload?.to;
      if (!toUserId) return;
      const sockets = userSocketByUserId.get(String(toUserId));
      if (!sockets || sockets.size === 0) return; // peer offline — drop
      for (const sid of sockets) {
        io.to(sid).emit(event, { ...payload, from: String(user._id) });
      }
    };
    socket.on('webrtc:offer', relayWebRTC('webrtc:offer'));
    socket.on('webrtc:answer', relayWebRTC('webrtc:answer'));
    socket.on('webrtc:ice-candidate', relayWebRTC('webrtc:ice-candidate'));

    // -- Disconnect ---------------------------------------------------------
    socket.on('disconnect', () => {
      // Remove from user socket index.
      const uSet = userSocketByUserId.get(String(user._id));
      if (uSet) {
        uSet.delete(socket.id);
        if (uSet.size === 0) userSocketByUserId.delete(String(user._id));
      }
      // Remove from presence map for the room the socket was in.
      const roomCode = socket.data.roomCode;
      if (roomCode) {
        const roomPresence = presenceByRoom.get(roomCode);
        if (roomPresence) {
          // Only remove if the socket id matches (multi-tab users).
          const entry = roomPresence.get(String(user._id));
          if (entry && entry.socketId === socket.id) {
            roomPresence.delete(String(user._id));
            io.to(`room:${roomCode}`).emit('presence:update', Array.from(roomPresence.values()));
          }
          // Clean up empty room maps to avoid memory growth.
          if (roomPresence.size === 0) presenceByRoom.delete(roomCode);
        }
      }
    });

    // -- Error --------------------------------------------------------------
    socket.on('error', (err) => {
      console.warn(`[${APP_NAME}] socket error [${user._id}]:`, err?.message || err);
    });
  });

  return io;
}

// Throttled persistence: avoid hammering Mongo on every chat/snapshot event.
async function persistRoomEvent(roomCode, kind, fn) {
  const key = `${roomCode}:${kind}`;
  const now = Date.now();
  const last = lastPersist.get(key) || 0;
  if (now - last < SOCKET_THROTTLE_MS) return; // skip — too soon
  lastPersist.set(key, now);
  try {
    const interview = await Interview.findOne({ roomCode }).select('_id').lean();
    if (!interview) return;
    await fn(interview._id);
  } catch (err) {
    console.warn(`[${APP_NAME}] persistRoomEvent failed (${kind}):`, err.message);
  }
}

export function getIO() {
  return io;
}

export default { initSocketManager, getIO };
