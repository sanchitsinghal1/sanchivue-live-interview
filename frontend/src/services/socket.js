import { io } from 'socket.io-client';
import { getAuthToken } from '../api/axiosInstance.js';

// Single lazy-initialized socket client. Components import `getSocket()` and
// attach event listeners; `disconnectSocket()` is called on logout.
let socket = null;

export function getSocket() {
  if (socket) return socket;

  const url = import.meta.env.VITE_SOCKET_URL || '/';
  socket = io(url, {
    path: '/',
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: (cb) => cb({ token: getAuthToken() }),
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  // Surface connection state in the console for easier debugging.
  socket.on('connect', () => console.debug('[socket] connected', socket.id));
  socket.on('disconnect', (reason) => console.debug('[socket] disconnected:', reason));
  socket.on('connect_error', (err) => console.warn('[socket] connect_error:', err.message));

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export default { getSocket, disconnectSocket };
