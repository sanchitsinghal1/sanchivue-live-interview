import { Link } from 'react-router-dom';
import { Check, Sparkles, Building2, Rocket, Shield } from 'lucide-react';
import { BRAND } from '../../constants/index.js';

// PricingPage — clearly labeled "proposed pricing until billing exists".
const PLANS = [
  {
    id: 'free',
    name: 'Starter',
    icon: Rocket,
    price: '$0',
    period: '/forever',
    desc: 'For individuals trying out the platform.',
    cta: 'Get Started',
    features: [
      'Up to 3 active interviews / month',
      'Question bank with public questions',
      'Live collaborative IDE',
      'Sandboxed code execution',
      'AI co-pilot (10 analyses/month)',
      'Email support',
    ],
    accent: 'indigo',
  },
  {
    id: 'pro',
    name: 'Professional',
    icon: Building2,
    price: '$49',
    period: '/interviewer/month',
    desc: 'For growing engineering teams.',
    cta: 'Start Pro Trial',
    features: [
      'Unlimited active interviews',
      'Question bank + custom questions',
      'AI co-pilot (unlimited)',
      'Anti-cheat proctoring + code replay',
      'JD-driven assessment blueprint',
      'AI summary + radar report',
      'Priority support',
    ],
    accent: 'emerald',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Shield,
    price: 'Custom',
    period: '',
    desc: 'For organizations with custom needs.',
    cta: 'Contact Sales',
    features: [
      'SSO + SAML + audit logs',
      'Self-hosted sandbox runtime option',
      'Custom rubrics + grading models',
      'Dedicated success manager',
      'Custom integrations (ATS, HRIS)',
      '99.9% uptime SLA',
    ],
    accent: 'indigo',
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          <Sparkles className="h-3 w-3" /> Proposed pricing until billing exists
        </span>
        <h1 className="mt-4 text-4xl font-bold text-slate-50">Pricing</h1>
        <p className="mt-3 text-slate-400">
          {BRAND.name} is in active development. The tiers below reflect the
          product direction. Until billing ships, all features are available
          to every signed-in user.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`card relative p-6 ${
              p.popular ? 'border-brand-indigo shadow-glow' : ''
            }`}
          >
            {p.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-indigo px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                Most Popular
              </span>
            )}
            <div className="flex items-center gap-3">
              <div
                className={`grid h-10 w-10 place-items-center rounded-md ${
                  p.accent === 'emerald'
                    ? 'bg-brand-emerald/10 text-brand-emerald'
                    : 'bg-brand-indigo/10 text-brand-indigo'
                }`}
              >
                <p.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-100">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.desc}</p>
              </div>
            </div>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-50">{p.price}</span>
              <span className="text-sm text-slate-500">{p.period}</span>
            </div>
            <ul className="mt-6 space-y-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-emerald" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to={p.id === 'enterprise' ? '/contact' : '/register'}
              className={`mt-6 w-full justify-center ${
                p.popular ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-slate-800 bg-slate-900/40 p-6 text-center">
        <p className="text-sm text-slate-400">
          All plans include unlimited candidates, the full question bank, and
          access to the AI assessment blueprint. No credit card required to
          start.
        </p>
      </div>
    </div>
  );
}
