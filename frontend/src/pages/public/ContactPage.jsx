import { useState } from 'react';
import { Mail, MessageSquare, MapPin, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/forms/Input.jsx';
import { isValidEmail } from '../../utils/validators.js';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill out every field.');
      return;
    }
    if (!isValidEmail(form.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    // Until the backend exposes a /contact endpoint, we simulate a successful
    // submission. Replace with `api.post('/contact', form)` once shipped.
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success('Thanks! We\'ll be in touch soon.');
      setForm({ name: '', email: '', message: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-50">Contact</h1>
        <p className="mt-3 text-slate-400">
          Questions, feedback, or interested in enterprise? Send us a note.
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        <aside className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <Mail className="h-4 w-4 text-brand-indigo" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">support@sanchivue.dev</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <MessageSquare className="h-4 w-4 text-brand-indigo" />
              <span className="text-sm font-medium">Live chat</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Mon–Fri, 9am–6pm IST</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-slate-200">
              <MapPin className="h-4 w-4 text-brand-indigo" />
              <span className="text-sm font-medium">Location</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Remote-first · India</p>
          </div>
        </aside>

        <form
          onSubmit={submit}
          className="card space-y-4 p-6 md:col-span-2"
        >
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            placeholder="Your name"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            icon={Mail}
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="you@company.com"
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="message" className="block text-sm font-medium text-slate-200">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={(e) => setField('message', e.target.value)}
              rows={5}
              required
              className="input-base resize-y"
              placeholder="Tell us what you're looking for…"
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
