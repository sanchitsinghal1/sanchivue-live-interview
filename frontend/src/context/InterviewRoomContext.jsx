import { createContext, useContext, useRef, useCallback, useState } from 'react';
import { getSocket } from '../services/socket.js';

// InterviewRoomContext exposes a thin wrapper around the collab socket for the
// live room. Components subscribe to events without each opening their own
// socket — this avoids duplicate connections + duplicate presence updates.
const InterviewRoomContext = createContext(null);

export function InterviewRoomProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const roomRef = useRef(null);
  const userRef = useRef(null);
  const joinedRef = useRef(false);

  // Lazily connect + remember connection state for the badge in the toolbar.
  const ensureSocket = useCallback(() => {
    const socket = getSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    if (socket.connected) setConnected(true);
    return socket;
  }, []);

  // Join a room. Idempotent — the collab service dedupes by userId anyway, but
  // we also track locally so we don't re-emit `join-room` on every reconnect.
  const joinRoom = useCallback(
    (roomCode, user) => {
      const socket = ensureSocket();
      roomRef.current = roomCode;
      userRef.current = user;
      if (socket.connected && !joinedRef.current) {
        socket.emit('join-room', { roomCode, user });
        joinedRef.current = true;
      }
      // Always re-join on (re)connect — the server may have evicted us.
      socket.off('connect', handleReconnect);
      socket.on('connect', handleReconnect);

      function handleReconnect() {
        if (roomRef.current && userRef.current) {
          socket.emit('join-room', { roomCode: roomRef.current, user: userRef.current });
        }
      }
    },
    [ensureSocket],
  );

  const leaveRoom = useCallback(() => {
    roomRef.current = null;
    userRef.current = null;
    joinedRef.current = false;
    // Note: we intentionally do NOT disconnect the socket here — the AuthContext
    // owns socket lifecycle (disconnect on logout). Other rooms may want it.
  }, []);

  // Generic event emit helper so children don't import the socket themselves.
  const emit = useCallback((event, payload) => {
    const socket = getSocket();
    socket.emit(event, payload);
  }, []);

  const on = useCallback((event, handler) => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const value = { connected, joinRoom, leaveRoom, emit, on };

  return (
    <InterviewRoomContext.Provider value={value}>{children}</InterviewRoomContext.Provider>
  );
}

export function useInterviewRoom() {
  const ctx = useContext(InterviewRoomContext);
  if (!ctx) throw new Error('useInterviewRoom must be used within an InterviewRoomProvider.');
  return ctx;
}

export default InterviewRoomContext;
