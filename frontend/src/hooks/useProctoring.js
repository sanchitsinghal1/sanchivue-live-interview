import { useEffect, useRef } from 'react';
import interviewApi from '../api/interview.api.js';

// useProctoring: attaches candidate-side browser listeners that emit
// proctoring violations to (a) the collab socket and (b) the backend.
// Each event type is debounced to a max of 1 emission per `debounceMs`.
// Returns nothing — it's a side-effect-only hook.
export function useProctoring({ interviewId, userId, enabled, emit, debounceMs = 3000 }) {
  const lastFiredRef = useRef({});

  useEffect(() => {
    if (!enabled || !interviewId || !userId) return undefined;

    const fire = (type, detail = {}) => {
      const now = Date.now();
      const last = lastFiredRef.current[type] || 0;
      if (now - last < debounceMs) return;
      lastFiredRef.current[type] = now;

      const payload = {
        type,
        detail,
        timestamp: new Date().toISOString(),
        interviewId,
        userId,
      };
      // Emit to the collab socket so the interviewer's feed updates instantly.
      if (emit) emit('proctoring:violation', payload);
      // Persist to the backend for the report timeline.
      interviewApi.recordProctoring(interviewId, payload).catch(() => {
        // We don't toast here — proctoring should be silent to the candidate.
      });
    };

    const onVisibility = () => {
      if (document.hidden) fire('tab-switch', { url: document.visibilityState });
    };
    const onBlur = () => fire('window-blur', {});
    const onPaste = (e) => {
      const text = e.clipboardData?.getData('text') || '';
      // > 200 chars pasted at once is treated as suspicious.
      if (text.length > 200) fire('paste-anomaly', { length: text.length });
    };
    const onFullscreenExit = () => {
      if (!document.fullscreenElement) fire('fullscreen-exit', {});
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('paste', onPaste);
    document.addEventListener('fullscreenchange', onFullscreenExit);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('fullscreenchange', onFullscreenExit);
    };
  }, [enabled, interviewId, userId, emit, debounceMs]);
}

export default useProctoring;
