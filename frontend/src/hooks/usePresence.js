import { useEffect, useState } from 'react';

// usePresence: tracks the list of users currently in a given room via the
// collab socket's `presence:update` events.
export function usePresence(roomCode, { on } = {}) {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    if (!roomCode || !on) return undefined;
    const off = on('presence:update', (list) => {
      setParticipants(Array.isArray(list) ? list : []);
    });
    return off;
  }, [roomCode, on]);

  const count = participants.length;

  return { participants, count };
}

export default usePresence;
