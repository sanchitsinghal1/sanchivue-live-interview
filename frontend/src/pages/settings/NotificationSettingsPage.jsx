import { useEffect, useState } from 'react';
import { Loader2, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext.jsx';

// NotificationSettingsPage — toggles for which channels to receive which
// events. Persisted via PATCH /notifications/preferences.
const DEFAULT_PREFS = {
  interviewScheduled: { email: true, inApp: true },
  interviewReminder: { email: true, inApp: true },
  evaluationReady: { email: true, inApp: true },
  proctoringAlert: { email: false, inApp: true },
  weeklyDigest: { email: true, inApp: false },
  productUpdates: { email: false, inApp: true },
};

const PREF_LABELS = {
  interviewScheduled: 'Interview scheduled',
  interviewReminder: 'Interview reminder (15 min before)',
  evaluationReady: 'Evaluation report ready',
  proctoringAlert: 'Proctoring alert raised',
  weeklyDigest: 'Weekly digest',
  productUpdates: 'Product updates',
};

export default function NotificationSettingsPage() {
  const { preferences, updatePreferences } = useNotifications();
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (preferences && typeof preferences === 'object') {
      setPrefs({ ...DEFAULT_PREFS, ...preferences });
    }
  }, [preferences]);

  const toggle = (key, channel) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [channel]: !prev[key]?.[channel],
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updatePreferences(prefs);
      toast.success('Preferences saved.');
    } catch {
      // toast handled by interceptor
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-50">
            <Bell className="h-5 w-5 text-brand-indigo" /> Notifications
          </h1>
          <p className="text-sm text-slate-500">Choose which events you want to be notified about.</p>
        </div>
        <button type="button" onClick={save} disabled={saving} className="btn-primary shrink-0 text-sm sm:self-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[400px] text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="px-4 py-2 text-left font-medium">Event</th>
              <th className="px-4 py-2 text-center font-medium">Email</th>
              <th className="px-4 py-2 text-center font-medium">In-app</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {Object.keys(DEFAULT_PREFS).map((key) => (
              <tr key={key}>
                <td className="px-4 py-3 text-slate-200">{PREF_LABELS[key]}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={!!prefs[key]?.email}
                    onChange={() => toggle(key, 'email')}
                    className="h-4 w-4 accent-brand-indigo"
                    aria-label={`${PREF_LABELS[key]} email`}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={!!prefs[key]?.inApp}
                    onChange={() => toggle(key, 'inApp')}
                    className="h-4 w-4 accent-brand-indigo"
                    aria-label={`${PREF_LABELS[key]} in-app`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 text-xs text-slate-500">
        Email notifications require a verified email address. In-app notifications appear in the
        bell icon at the top of your dashboard.
      </div>
    </div>
  );
}
