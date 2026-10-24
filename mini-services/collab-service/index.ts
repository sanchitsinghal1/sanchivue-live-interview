/**
 * collab-service
 * ---------------
 * Socket.io real-time collaboration mini-service for the
 * Live Technical Interview & AI Assessment Platform.
 *
 * The service runs as a STANDALONE Bun process on port 3003.
 * The Next.js frontend connects via the Caddy gateway using
 *   io('/?XTransformPort=3003', { transports: ['websocket','polling'] })
 * NEVER a direct localhost URL — Caddy inspects the XTransformPort
 * query param and forwards the request here.
 *
 * Connection contract follows the reference example at
 * /examples/websocket/server.ts:
 *   - path: '/'
 *   - cors.origin: '*'
 *   - port: 3003
 */

import { createServer } from 'http'
import { Server } from 'socket.io'

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

type Role = 'interviewer' | 'candidate'

interface RoomUser {
  socketId: string
  userId: string
  userName: string
  role: Role
  roomCode: string
  color?: string
}

interface Snapshot {
  code: string
  language: string
  eventType: string
  timestamp: string
}

type ProctoringType =
  | 'tab-switch'
  | 'window-blur'
  | 'paste-anomaly'
  | 'fullscreen-exit'

// ---------------------------------------------------------------------------
// In-memory state
// ---------------------------------------------------------------------------

/** All connected users, keyed by socket.id — used for presence & WebRTC lookup. */
const users = new Map<string, RoomUser>()

/** Reverse lookup: userId -> socket.id — used for targeted WebRTC relay. */
const userSocketByUserId = new Map<string, string>()

/** Code snapshots per room, capped at MAX_SNAPSHOTS_PER_ROOM. */
const snapshots = new Map<string, Snapshot[]>()

const MAX_SNAPSHOTS_PER_ROOM = 200

// ---------------------------------------------------------------------------
// HTTP + Socket.io server setup
// ---------------------------------------------------------------------------

const httpServer = createServer()

const io = new Server(httpServer, {
  // DO NOT change the path — Caddy uses it to forward requests.
  path: '/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const roomKey = (roomCode: string) => `room:${roomCode}`

/** Return the list of participants currently in a room. */
const participantsInRoom = (roomCode: string): RoomUser[] => {
  const key = roomKey(roomCode)
  const out: RoomUser[] = []
  for (const user of users.values()) {
    if (user.roomCode === roomCode) {
      out.push({
        socketId: user.socketId,
        userId: user.userId,
        userName: user.userName,
        role: user.role,
        roomCode: user.roomCode,
        color: user.color,
      })
    }
  }
  // Best-effort: also rely on socket.io's room membership for sanity.
  void key
  return out
}

/** Broadcast the current participant list for a room. */
const broadcastPresence = (roomCode: string) => {
  const participants = participantsInRoom(roomCode)
  io.to(roomKey(roomCode)).emit('presence:update', {
    roomCode,
    participants,
    count: participants.length,
  })
}

/** Push a snapshot to the in-memory store (keeping last 200). */
const pushSnapshot = (roomCode: string, snapshot: Snapshot) => {
  const list = snapshots.get(roomCode) ?? []
  list.push(snapshot)
  // Trim to the last MAX_SNAPSHOTS_PER_ROOM entries.
  if (list.length > MAX_SNAPSHOTS_PER_ROOM) {
    list.splice(0, list.length - MAX_SNAPSHOTS_PER_ROOM)
  }
  snapshots.set(roomCode, list)
}

// ---------------------------------------------------------------------------
// Connection lifecycle
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
  console.log(`[connect] socket=${socket.id}`)

  // ---------------------------------------------------------------------
  // Presence: join-room
  // ---------------------------------------------------------------------
  socket.on(
    'join-room',
    (payload: { roomCode: string; userId: string; userName: string; role: Role; color?: string }) => {
      const { roomCode, userId, userName, role, color } = payload

      // Leave any previously joined room (a socket is only in one interview room at a time).
      const previous = users.get(socket.id)
      if (previous && previous.roomCode !== roomCode) {
        socket.leave(roomKey(previous.roomCode))
        console.log(`[room-leave] socket=${socket.id} room=${previous.roomCode}`)
        broadcastPresence(previous.roomCode)
      }

      // Join the new room.
      socket.join(roomKey(roomCode))

      const user: RoomUser = {
        socketId: socket.id,
        userId,
        userName,
        role,
        roomCode,
        color,
      }
      users.set(socket.id, user)
      userSocketByUserId.set(userId, socket.id)

      console.log(
        `[room-join] socket=${socket.id} user=${userName}(${userId}) role=${role} room=${roomCode}`,
      )

      broadcastPresence(roomCode)
    },
  )

  // ---------------------------------------------------------------------
  // Live code sync
  // ---------------------------------------------------------------------
  socket.on(
    'code:change',
    (payload: { roomCode: string; code: string; language: string }) => {
      socket.to(roomKey(payload.roomCode)).emit('code:change', payload)
    },
  )

  socket.on('language:change', (payload: { roomCode: string; language: string }) => {
    socket.to(roomKey(payload.roomCode)).emit('language:change', payload)
  })

  socket.on(
    'cursor:move',
    (payload: {
      roomCode: string
      line: number
      column: number
      userId: string
      userName: string
      color: string
    }) => {
      socket.to(roomKey(payload.roomCode)).emit('cursor:move', payload)
    },
  )

  // ---------------------------------------------------------------------
  // Chat (broadcast to everyone in the room, including sender)
  // ---------------------------------------------------------------------
  socket.on(
    'chat:message',
    (payload: {
      roomCode: string
      userId: string
      userName: string
      content: string
      timestamp: string
    }) => {
      io.to(roomKey(payload.roomCode)).emit('chat:message', payload)
    },
  )

  // ---------------------------------------------------------------------
  // Whiteboard
  // ---------------------------------------------------------------------
  socket.on(
    'whiteboard:draw',
    (payload: { roomCode: string; points: unknown; color: string; tool: string }) => {
      socket.to(roomKey(payload.roomCode)).emit('whiteboard:draw', payload)
    },
  )

  socket.on('whiteboard:clear', (payload: { roomCode: string }) => {
    socket.to(roomKey(payload.roomCode)).emit('whiteboard:clear', payload)
  })

  /**
   * A freshly-joined client asks the room for the current canvas state.
   * Other clients in the room may reply with `whiteboard:state`, which
   * we broadcast to everyone so the requester receives it.
   */
  socket.on('whiteboard:sync-request', (payload: { roomCode: string }) => {
    socket.to(roomKey(payload.roomCode)).emit('whiteboard:sync-request', payload)
  })

  socket.on(
    'whiteboard:state',
    (payload: { roomCode: string; state: unknown }) => {
      io.to(roomKey(payload.roomCode)).emit('whiteboard:state', payload)
    },
  )

  // ---------------------------------------------------------------------
  // Proctoring (candidate -> interviewer)
  // ---------------------------------------------------------------------
  socket.on(
    'proctoring:violation',
    (payload: {
      roomCode: string
      type: ProctoringType
      detail: string
      severity: 'info' | 'warning' | 'critical'
      timestamp: string
    }) => {
      // Broadcast to the whole room — interviewers listen for this event.
      io.to(roomKey(payload.roomCode)).emit('proctoring:violation', payload)
    },
  )

  // ---------------------------------------------------------------------
  // Code snapshots (for replay)
  // ---------------------------------------------------------------------
  socket.on(
    'snapshot:save',
    (payload: {
      roomCode: string
      code: string
      language: string
      eventType: string
      timestamp: string
    }) => {
      const snapshot: Snapshot = {
        code: payload.code,
        language: payload.language,
        eventType: payload.eventType,
        timestamp: payload.timestamp,
      }
      pushSnapshot(payload.roomCode, snapshot)

      const list = snapshots.get(payload.roomCode) ?? []
      io.to(roomKey(payload.roomCode)).emit('snapshot:saved', {
        roomCode: payload.roomCode,
        count: list.length,
      })
    },
  )

  socket.on('snapshot:request', (payload: { roomCode: string }) => {
    const list = snapshots.get(payload.roomCode) ?? []
    socket.emit('snapshot:list', {
      roomCode: payload.roomCode,
      snapshots: list,
    })
  })

  // ---------------------------------------------------------------------
  // WebRTC signaling (relay only)
  // ---------------------------------------------------------------------
  const relayWebRTC = (
    eventName: 'webrtc:offer' | 'webrtc:answer' | 'webrtc:ice-candidate',
    payload: { roomCode: string; from: string; to: string; payload: unknown },
  ) => {
    const targetSocketId = userSocketByUserId.get(payload.to)
    if (!targetSocketId) {
      // Target user not found — drop silently (no crash).
      return
    }
    io.to(targetSocketId).emit(eventName, payload)
  }

  socket.on('webrtc:offer', (payload: { roomCode: string; from: string; to: string; payload: unknown }) => {
    relayWebRTC('webrtc:offer', payload)
  })

  socket.on('webrtc:answer', (payload: { roomCode: string; from: string; to: string; payload: unknown }) => {
    relayWebRTC('webrtc:answer', payload)
  })

  socket.on('webrtc:ice-candidate', (payload: { roomCode: string; from: string; to: string; payload: unknown }) => {
    relayWebRTC('webrtc:ice-candidate', payload)
  })

  // ---------------------------------------------------------------------
  // Disconnect
  // ---------------------------------------------------------------------
  socket.on('disconnect', (reason: string) => {
    const user = users.get(socket.id)
    if (user) {
      users.delete(socket.id)
      userSocketByUserId.delete(user.userId)
      console.log(
        `[disconnect] socket=${socket.id} user=${user.userName}(${user.userId}) room=${user.roomCode} reason=${reason}`,
      )
      broadcastPresence(user.roomCode)
    } else {
      console.log(`[disconnect] socket=${socket.id} reason=${reason}`)
    }
  })

  socket.on('error', (error: unknown) => {
    console.error(`[socket-error] socket=${socket.id}:`, error)
  })
})

// ---------------------------------------------------------------------------
// Boot & graceful shutdown
// ---------------------------------------------------------------------------

const PORT = 3003

httpServer.listen(PORT, () => {
  console.log(`[collab-service] Socket.io server listening on port ${PORT}`)
})

const shutdown = (signal: string) => {
  console.log(`[collab-service] Received ${signal}, shutting down...`)
  // Notify all clients that the server is going down.
  io.emit('server:shutdown', { reason: signal, timestamp: new Date().toISOString() })
  io.close(() => {
    httpServer.close(() => {
      console.log('[collab-service] Server closed')
      process.exit(0)
    })
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
