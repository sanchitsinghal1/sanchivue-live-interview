// Lightweight wrapper around localStorage with JSON serialization + safe access.
const PREFIX = 'sanchivue:';

export const storage = {
  get(key, fallback = null) {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or disabled — ignore.
    }
  },
  remove(key) {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },
};

export default storage;
