import { useEffect, useRef, useState } from 'react';
import { getSocket } from '../services/socket.js';

// useSocket: convenience hook returning the singleton socket + connection state.
// Components that only need to read state (e.g. a connection badge) use this
// instead of pulling InterviewRoomContext (which manages room membership).
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;
    setConnected(socket.connected);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, connected };
}

export default useSocket;
