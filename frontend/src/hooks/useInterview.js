import { useCallback, useEffect, useState } from 'react';
import interviewApi from '../api/interview.api.js';

// useInterview: a small wrapper that fetches a single interview by id and
// exposes refresh() so the live room can re-sync after a PATCH.
export function useInterview(id) {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return null;
    setLoading(true);
    try {
      const res = await interviewApi.get(id);
      const data = res?.data?.data;
      setInterview(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patch = useCallback(
    async (payload) => {
      if (!id) return null;
      const res = await interviewApi.update(id, payload);
      const data = res?.data?.data;
      // Optimistically merge so the UI feels instant.
      setInterview((prev) => ({ ...prev, ...data }));
      return data;
    },
    [id],
  );

  return { interview, setInterview, loading, error, refresh, patch };
}

export default useInterview;
