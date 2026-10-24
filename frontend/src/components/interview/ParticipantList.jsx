import { getInitials, colorFromString } from '../../utils/formatters.js';
import { ROLE_LABELS } from '../../constants/index.js';

// ParticipantList — small inline list used in the live room toolbar.
// Each participant gets a colored dot (deterministic from their id).
export default function ParticipantList({ participants = [], max = 6, className = '' }) {
  const visible = participants.slice(0, max);
  const overflow = participants.length - visible.length;
  return (
    <div
      className={`flex items-center -space-x-2 ${className}`}
      aria-label={`${participants.length} participants`}
    >
      {visible.map((p) => {
        const dot = colorFromString(p.id || p.userId || p.email || p.name);
        return (
          <span
            key={p.id || p.userId || p.email}
            title={`${p.name || 'Participant'} · ${ROLE_LABELS[p.role] || p.role || ''}`}
            className={`grid h-7 w-7 place-items-center rounded-full border-2 border-slate-950 text-[10px] font-bold text-white ${dot}`}
          >
            {getInitials(p.name || p.email || '?')}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-slate-950 bg-slate-700 text-[10px] font-bold text-slate-200">
          +{overflow}
        </span>
      )}
    </div>
  );
}
