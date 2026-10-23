import { BRAND } from '../../constants/index.js';

// CreatorCredit — small attribution used in the footer of public + auth pages.
export default function CreatorCredit({ className = '' }) {
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      Built by{' '}
      <span className="font-medium text-slate-300">{BRAND.creator}</span>
    </p>
  );
}
