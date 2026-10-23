"use client";

import { io, type Socket } from "socket.io-client";
import { COLLAB_PORT } from "@/lib/client-constants";

// Singleton Socket.io client for the collaboration service. Connects via the
// Caddy gateway using the XTransformPort query (never a direct localhost URL).
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io("/?XTransformPort=" + COLLAB_PORT, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 800,
    timeout: 10000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
