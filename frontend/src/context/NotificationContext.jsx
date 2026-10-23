import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import notificationApi from '../api/notification.api.js';
import { useAuth } from './AuthContext.jsx';
import { getSocket } from '../services/socket.js';

// NotificationContext polls notifications + listens on the socket for the
// `notification:new` event so the bell badge stays in sync in real time.
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState({});

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.list({ limit: 20 });
      const data = res?.data?.data || [];
      setItems(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch {
      // silent — most failures are session-expired which the interceptor handles.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) fetchNotifications();
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications]);

  // Real-time push via socket.
  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    const onNew = (n) => {
      setItems((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((c) => c + 1);
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [isAuthenticated]);

  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore — toast handled by interceptor
    }
  }, []);

  const updatePreferences = useCallback(async (payload) => {
    const res = await notificationApi.updatePreferences(payload);
    setPreferences(res?.data?.data || payload);
    return res?.data?.data;
  }, []);

  const value = {
    items,
    unreadCount,
    preferences,
    fetchNotifications,
    markRead,
    updatePreferences,
  };

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider.');
  return ctx;
}

export default NotificationContext;
